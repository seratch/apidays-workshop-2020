exports.loadEnv = function () {
  // See https://github.com/motdotla/dotenv
  const config = require("dotenv").config().parsed;
  // Overwrite env variables anyways
  for (const k in config) {
    process.env[k] = config[k];
  }
};

function toPrettfiedJSONString(json) {
  return JSON.stringify(json, null, 2);
}

exports.toPrettfiedJSONString = toPrettfiedJSONString;

exports.enableReqeustLogger = function (app) {
  app.use(async (args) => {
    const copiedArgs = JSON.parse(JSON.stringify(args));
    copiedArgs.context.botToken = 'xoxb-***';
    if (copiedArgs.context.userToken) {
      copiedArgs.context.userToken = 'xoxp-***';
    }
    copiedArgs.client = {};
    copiedArgs.logger = {};
    args.logger.info(
      "\n" +
      "---------------\n" +
      "   Context\n" +
      "---------------\n" +
      toPrettfiedJSONString(copiedArgs.context) +
      "\n"
    );
    args.logger.info(
      "\n" +
      "---------------\n" +
      "   Payload\n" +
      "---------------\n" +
      toPrettfiedJSONString(copiedArgs.body) +
      "\n"
    );
    const result = await args.next();
    return result;
  });
};

exports.sendNotification = async function (client, userIdOrChannelId, text) {
  if (typeof userIdOrChannelId !== "undefined") {
    if (userIdOrChannelId.startsWith("U") || userIdOrChannelId.startsWith("W")) {
      const userId = userIdOrChannelId;
      const botDm = await client.conversations.open({ users: userId })
      await client.chat.postMessage({
        channel: botDm.channel.id,
        text: text,
      });
    } else {
      const channelId = userIdOrChannelId;
      await client.chat.postMessage({
        channel: channelId,
        text: text,
      });
    }
  }
};


exports.buildInitialModalView = function (callbackId) {
  return {
    "type": "modal",
    "callback_id": callbackId,
    "title": {
      "type": "plain_text",
      "text": "Helpdesk Request"
    },
    "close": {
      "type": "plain_text",
      "text": "Close"
    },
    "blocks": [
      {
        "type": "section",
        "text": {
          "type": "mrkdwn",
          "text": ":wave: Select a category."
        }
      },
      {
        "type": "actions",
        "elements": [
          {
            "type": "static_select",
            "action_id": "helpdesk-request-modal-category-selection",
            "options": [
              {
                "text": {
                  "type": "plain_text",
                  "text": "Laptop"
                },
                "value": "laptop"
              },
              {
                "text": {
                  "type": "plain_text",
                  "text": "Mobile"
                },
                "value": "mobile"
              },
              {
                "text": {
                  "type": "plain_text",
                  "text": "Other"
                },
                "value": "other"
              }
            ]
          }
        ]
      }
    ]
  };
}

exports.buildSecondModalView = function (callbackId, blocks, privateMetadata) {
  return {
    "type": "modal",
    "callback_id": callbackId,
    "private_metadata": privateMetadata,
    "title": {
      "type": "plain_text",
      "text": "Helpdesk Request"
    },
    "submit": {
      "type": "plain_text",
      "text": "Submit"
    },
    "close": {
      "type": "plain_text",
      "text": "Close"
    },
    "blocks": blocks
  };
};

class ModalViewBlocks {

  static header(text) {
    return {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": text
      },
      "accessory": {
        "type": "button",
        "action_id": "helpdesk-request-modal-reset",
        "text": {
          "type": "plain_text",
          "text": "Back"
        },
        "value": "1"
      }
    };
  };

  static title(initialValue) {
    return {
      "type": "input",
      "block_id": "title",
      "label": {
        "type": "plain_text",
        "text": "Title"
      },
      "element": {
        "type": "plain_text_input",
        "action_id": "element",
        "initial_value": initialValue
      }
    };
  };

  static laptopModel() {
    return {
      "type": "input",
      "block_id": "laptop-model",
      "label": {
        "type": "plain_text",
        "text": "Laptop Model"
      },
      "element": {
        "type": "static_select",
        "action_id": "element",
        "options": [
          {
            "text": {
              "type": "plain_text",
              "text": "MacBook Pro (16-inch, 2019)"
            },
            "value": "MacBookPro16,1"
          },
          {
            "text": {
              "type": "plain_text",
              "text": "MacBook Pro (13-inch, 2019, Two Thunderbolt 3 ports)"
            },
            "value": "MacBookPro15,4"
          },
          {
            "text": {
              "type": "plain_text",
              "text": "Surface Book 3 for Business"
            },
            "value": "SurfaceBook3"
          }
        ]
      }
    };
  };

  static mobileOS() {
    return {
      "type": "input",
      "block_id": "os",
      "label": {
        "type": "plain_text",
        "text": "Mobile OS"
      },
      "element": {
        "type": "static_select",
        "action_id": "element",
        "placeholder": {
          "type": "plain_text",
          "text": "Select an item"
        },
        "options": [
          {
            "text": {
              "type": "plain_text",
              "text": "iOS"
            },
            "value": "ios"
          },
          {
            "text": {
              "type": "plain_text",
              "text": "Android"
            },
            "value": "android"
          }
        ]
      }
    };
  };

  static description() {
    return {
      "type": "input",
      "block_id": "description",
      "label": {
        "type": "plain_text",
        "text": "Description"
      },
      "element": {
        "type": "plain_text_input",
        "action_id": "element",
        "multiline": true
      }
    };
  }

  static approver() {
    return {
      "type": "input",
      "block_id": "approver",
      "label": {
        "type": "plain_text",
        "text": "Approver"
      },
      "element": {
        "type": "users_select",
        "action_id": "element",
        "placeholder": {
          "type": "plain_text",
          "text": "Select your approver"
        }
      }
    };
  };

  static dueDate() {
    return {
      "type": "input",
      "block_id": "due-date",
      "element": {
        "type": "datepicker",
        "action_id": "element"
      },
      "label": {
        "type": "plain_text",
        "text": "Due date",
        "emoji": true
      }
    };
  }
}

exports.ModalViewBlocks = ModalViewBlocks;
