const {
  loadEnv,
  enableReqeustLogger,
  sendNotification,
  buildInitialModalView,
  buildSecondModalView,
  toPrettfiedJSONString,
  ModalViewBlocks,
} = require("./utils");

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

// -------------------------------
// Task: Add a Global Shortcut listener
{
  // -------------------------------
  // Task: Acknowledge a shortcut invocation
  // https://api.slack.com/interactivity/handling#acknowledgment_response

  // -------------------------------
  // Task: Open the step1 modal
  // https://api.slack.com/methods/views.open
  // https://api.slack.com/block-kit-builder
  // ./modals/step1.json
}

// -------------------------------
// Task: Add a listener for category selection
{
  // -------------------------------
  // Task: Acknowledge a category selection event
  // https://api.slack.com/interactivity/handling#acknowledgment_response

  // -------------------------------
  // Task: Update the modal to display step2
  // https://api.slack.com/methods/views.update
  // https://api.slack.com/block-kit-builder
  // ./modals/step2.json
}

// -------------------------------
// Task: Add a listener for the button to go back
{
  // -------------------------------
  // Task: Acknowledge a button click
  // https://api.slack.com/interactivity/handling#acknowledgment_response

  // -------------------------------
  // Task: Update the modal to display step1
  // https://api.slack.com/methods/views.update
  // https://api.slack.com/block-kit-builder
  // ./modals/step1.json
}

// -------------------------------
// Task: Add a modal data submisson listener
{
  // -------------------------------
  // Task: Extract the submitted data
  // https://api.slack.com/reference/interaction-payloads/views#view_submission

  // -------------------------------
  // Task: Add input validations
  // https://api.slack.com/surfaces/modals/using#displaying_errors

  // -------------------------------
  // Task: Acknowldge the valid submission and close the model
  // https://api.slack.com/interactivity/handling#acknowledgment_response

  // -------------------------------
  // Task: Send notifications to the helkdesk team's channel, the submitter, and the approver
  // https://api.slack.com/methods/chat.postMessage
  // https://api.slack.com/methods/conversations.open

  // -------------------------------
  // Appendix: Update the submitter's Home tab
  // To enable this, turn on Home tab in the App Home config page
}

// Appendix: pseudo database for Home tab ({user: [message]})
const submissions = {};
