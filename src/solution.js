const {
  loadEnv,
  enableReqeustLogger,
  sendNotification,
  buildInitialModalView,
  buildSecondModalView,
  toPrettfiedJSONString,
  ModalViewBlocks,
} = require("./utils");

// ------------------------------------------------------
// *** Slask App Configuration ***

// OAuth & Permissions
//  - Visit https://api.slack.com/apps after signing to Slack (https://slack.com/signin)
//  - Go to OAuth & Permissions page
//  - Bot token scopes: commands, chat:write, chat:write.public, im:write

// Set the following values in .env file
//   - SLACK_BOT_TOKEN (Settings > Install App)
//   - SLACK_SIGNING_SECRET (Settings > Basic Information > App Credentials > Signing Secret)
loadEnv();

const { App } = require("@slack/bolt");

// App is the abstraction of a Slack app.
// We use this instance for registering middleware and listeners, and starting a web server process.
const app = new App({
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  token: process.env.SLACK_BOT_TOKEN,
});
enableReqeustLogger(app);

// npm run local (nodemon watches file changes)
(async () => {
  await app.start(process.env.PORT || 3000); // POST http://localhost:3000/slack/events
  console.log("⚡️ Bolt app is running!");
})();

// ------------------------------------------------------
// *** Global Shortcut & Modal ***

// Interactivity & Shortcuts
//  - Turn on the feature and set the endpoint URL (https://{domain}/slack/events) as the Request URL
//  - Add a Global Shortcut with callback_id: new-helpdesk-request

// ------------------------------------------------------
// Task: Add a Global Shortcut listener
app.shortcut("new-helpdesk-request", async ({ logger, client, body, ack }) => {

  // -------------------------------
  // Task: Acknowledge a shortcut invocation
  // https://api.slack.com/interactivity/handling#acknowledgment_response
  await ack();

  // -------------------------------
  // Task: Open the step1 modal
  // https://api.slack.com/methods/views.open
  // https://api.slack.com/block-kit-builder
  // ./modals/step1.json
  const step1ModalView = buildInitialModalView("helpdesk-request-modal");
  logger.info(toPrettfiedJSONString(step1ModalView));

  const res = await client.views.open({
    "trigger_id": body.trigger_id,
    "view": step1ModalView,
  });
  logger.info("views.open response:\n\n" + toPrettfiedJSONString(res) + "\n");

});

// -------------------------------
// Task: Add a listener for category selection
app.action("helpdesk-request-modal-category-selection", async ({ ack, action, body, logger, client }) => {

  // -------------------------------
  // Task: Acknowledge a category selection event
  // https://api.slack.com/interactivity/handling#acknowledgment_response
  await ack();

  // -------------------------------
  // Task: Update the modal to display step2
  // https://api.slack.com/methods/views.update
  // https://api.slack.com/block-kit-builder
  // ./modals/step2.json
  const category = action.selected_option.value;
  const privateMetadata = JSON.stringify({ "category": category }); // category value
  const blocks = [];
  if (category === "laptop") {
    for (block of [
      ModalViewBlocks.header("You're making a request on your laptop."),
      ModalViewBlocks.title("Laptop Replacement"),
      ModalViewBlocks.laptopModel(),
    ]) blocks.push(block);
  } else if (category === "mobile") {
    for (block of [
      ModalViewBlocks.header("You're making a request on your mobile devices."),
      ModalViewBlocks.title("Mobile Device Replacement"),
      ModalViewBlocks.mobileOS(),
      ModalViewBlocks.approver(),
      ModalViewBlocks.dueDate(),
    ]) blocks.push(block);
  } else if (category === "other") {
    for (block of [
      ModalViewBlocks.header("You're making a request on your This may be a bit rare one. Please share the details with us as much as possible."),
      ModalViewBlocks.title(""),
      ModalViewBlocks.description(),
    ]) blocks.push(block);
  } else {
    throw new Exception(`Unknown category type detected (${category})`);
  }

  const step2ModalView = buildSecondModalView("helpdesk-request-modal", blocks, privateMetadata);
  logger.info(toPrettfiedJSONString(step2ModalView));

  const res = await client.views.update({
    view_id: body.view.id,
    hash: body.view.hash,
    view: step2ModalView,
  });
  logger.info("views.update response:\n\n" + toPrettfiedJSONString(res) + "\n");

});

// -------------------------------
// Task: Add a listener for the button to go back
app.action("helpdesk-request-modal-reset", async ({ ack, body, logger, client }) => {

  // -------------------------------
  // Task: Acknowledge a button click
  // https://api.slack.com/interactivity/handling#acknowledgment_response
  await ack();

  // -------------------------------
  // Task: Update the modal to display step1
  // https://api.slack.com/methods/views.update
  // https://api.slack.com/block-kit-builder
  // ./modals/step1.json
  const step1ModalView = buildInitialModalView("helpdesk-request-modal");
  logger.info(toPrettfiedJSONString(step1ModalView));

  const res = await client.views.update({
    view_id: body.view.id,
    hash: body.view.hash,
    view: step1ModalView,
  });
  logger.info("views.update response:\n\n" + toPrettfiedJSONString(res) + "\n");
});

// -------------------------------
// Task: Add a modal data submisson listener
app.view("helpdesk-request-modal", async ({ logger, client, body, ack }) => {

  // -------------------------------
  // Task: Extract the submitted data
  // https://api.slack.com/reference/interaction-payloads/views#view_submission
  const values = body.view.state.values;
  logger.info(`view.state.values: ${toPrettfiedJSONString(values)}`);

  // values[blockId][actionId].value/selected_*
  const actionId = "element";
  const title = values["title"] ? values["title"][actionId].value : undefined;
  const laptopModel = values["laptop-model"] ? values["laptop-model"][actionId].selected_option.value : undefined;
  const os = values["os"] ? values["os"][actionId].selected_option.value : undefined;
  const description = values["description"] ? values["description"][actionId].value : undefined;
  const dueDate = values["due-date"] ? values["due-date"][actionId].selected_date : undefined;
  const approver = values["approver"] ? values["approver"][actionId].selected_user : undefined;

  // -------------------------------
  // Task: Add input validations
  // https://api.slack.com/surfaces/modals/using#displaying_errors
  const errors = {};
  if (typeof title !== "undefined" && title.length <= 5) {
    errors["title"] = "Title must be longer than 5 characters";
  }
  if (typeof dueDate !== "undefined" && new Date(dueDate) < new Date()) {
    errors["due-date"] = "Due date must be in the future";
  }
  if (Object.entries(errors).length > 0) {
    // Tell the user errors on the modal
    await ack({
      response_action: 'errors',
      errors: errors
    });
    return;
  }

  // -------------------------------
  // Task: Acknowldge the valid submission and close the model
  // https://api.slack.com/interactivity/handling#acknowledgment_response
  await ack();

  // TODO: Store the data and do something meaningful here
  const approverLink = approver ? `<@${approver}>` : "-";
  const message = `*Title*: ${title}\n*Laptop Model*: ${laptopModel || "-"}\n*Mobile OS*: ${os || "-"}\n*Description*: ${description || "-"}\n*Due Date*: ${dueDate || "-"}\n*Approver*: ${approverLink}`;
  logger.info(message);

  // -------------------------------
  // Task: Send notifications to the helkdesk team's channel, the submitter, and the approver
  // https://api.slack.com/methods/chat.postMessage
  // https://api.slack.com/methods/conversations.open
  const submitter = body.user.id;
  const helpdeskTeamTriageChannel = "#general"; // TODO Use the right channel here
  // const helpdeskTeamTriageChannel = "#triage-helpdesk";
  await sendNotification(
    client,
    helpdeskTeamTriageChannel,
    `:new: *New Request* :new:\nWe’ve got a request from <@${submitter}>:\n${message}`
  );
  await sendNotification(
    client,
    submitter,
    `*Thank you!* :bow:\nYou've sent the following request. I will update you on this shortly.\n${message}`
  );
  await sendNotification(
    client,
    approver,
    `:wave: Hi from Helpdesk team! <@${submitter}> needs *your approval* on the following request.\n${message}`
  );

  // -------------------------------
  // Appendix: Update the submitter's Home tab
  // To enable this, turn on Home tab in the App Home config page

  // Add this item to the pseudo database
  submissions[submitter] = submissions[submitter] || []
  submissions[submitter].push(message)

  // Build an up-to-date view for this user's Home tab
  const blocks = []
  for (msg of submissions[submitter]) {
    blocks.push({
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": msg
      }
    });
    blocks.push({ "type": "divider" });
  }
  await client.views.publish({
    user_id: submitter,
    view: {
      "type": "home",
      "blocks": blocks,
    }
  });
});

// Appendix: pseudo database for Home tab ({user: [message]})
const submissions = {};
