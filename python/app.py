import logging
from datetime import datetime

from slack_bolt import App, Ack
from slack_sdk import WebClient

logging.basicConfig(level=logging.DEBUG)

app = App()

step1_modal = {
    "type": "modal",
    "callback_id": "helpdesk-request-modal",
    "title": {"type": "plain_text", "text": "Helpdesk Request"},
    "close": {"type": "plain_text", "text": "Close"},
    "blocks": [
        {
            "type": "section",
            "text": {"type": "mrkdwn", "text": ":wave: Select a category."},
        },
        {
            "type": "actions",
            "elements": [
                {
                    "type": "static_select",
                    "action_id": "helpdesk-request-modal-category-selection",
                    "options": [
                        {
                            "text": {"type": "plain_text", "text": "Laptop"},
                            "value": "laptop",
                        },
                        {
                            "text": {"type": "plain_text", "text": "Mobile"},
                            "value": "mobile",
                        },
                        {
                            "text": {"type": "plain_text", "text": "Other"},
                            "value": "other",
                        },
                    ],
                }
            ],
        },
    ],
}
step2_laptop_modal = {
    "type": "modal",
    "callback_id": "helpdesk-request-modal",
    "title": {"type": "plain_text", "text": "Helpdesk Request"},
    "submit": {"type": "plain_text", "text": "Submit"},
    "close": {"type": "plain_text", "text": "Close"},
    "blocks": [
        {
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": "You're making a request on your laptop.",
            },
            "accessory": {
                "type": "button",
                "action_id": "helpdesk-request-modal-reset",
                "text": {"type": "plain_text", "text": "Back"},
                "value": "1",
            },
        },
        {
            "type": "input",
            "block_id": "title",
            "label": {"type": "plain_text", "text": "Title"},
            "element": {
                "type": "plain_text_input",
                "action_id": "element",
                "initial_value": "Laptop Replacement",
            },
        },
        {
            "type": "input",
            "block_id": "laptop-model",
            "label": {"type": "plain_text", "text": "Laptop Model"},
            "element": {
                "type": "static_select",
                "action_id": "element",
                "options": [
                    {
                        "text": {
                            "type": "plain_text",
                            "text": "MacBook Pro (16-inch, 2019)",
                        },
                        "value": "MacBookPro16,1",
                    },
                    {
                        "text": {
                            "type": "plain_text",
                            "text": "MacBook Pro (13-inch, 2019, Two Thunderbolt 3 ports)",
                        },
                        "value": "MacBookPro15,4",
                    },
                    {
                        "text": {
                            "type": "plain_text",
                            "text": "Surface Book 3 for Business",
                        },
                        "value": "SurfaceBook3",
                    },
                ],
            },
        },
    ],
}

step2_mobile_modal = {
    "type": "modal",
    "callback_id": "helpdesk-request-modal",
    "title": {"type": "plain_text", "text": "Helpdesk Request"},
    "submit": {"type": "plain_text", "text": "Submit"},
    "close": {"type": "plain_text", "text": "Close"},
    "blocks": [
        {
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": "You're making a request on your mobile devices.",
            },
            "accessory": {
                "type": "button",
                "action_id": "helpdesk-request-modal-reset",
                "text": {"type": "plain_text", "text": "Back"},
                "value": "1",
            },
        },
        {
            "type": "input",
            "block_id": "title",
            "label": {"type": "plain_text", "text": "Title"},
            "element": {
                "type": "plain_text_input",
                "action_id": "element",
                "initial_value": "Mobile Device Replacement",
            },
        },
        {
            "type": "input",
            "block_id": "os",
            "label": {"type": "plain_text", "text": "Mobile OS"},
            "element": {
                "type": "static_select",
                "action_id": "element",
                "placeholder": {"type": "plain_text", "text": "Select an item"},
                "options": [
                    {"text": {"type": "plain_text", "text": "iOS"}, "value": "ios"},
                    {
                        "text": {"type": "plain_text", "text": "Android"},
                        "value": "android",
                    },
                ],
            },
        },
        {
            "type": "input",
            "block_id": "approver",
            "label": {"type": "plain_text", "text": "Approver"},
            "element": {
                "type": "users_select",
                "action_id": "element",
                "placeholder": {"type": "plain_text", "text": "Select your approver"},
            },
        },
        {
            "type": "input",
            "block_id": "due-date",
            "element": {"type": "datepicker", "action_id": "element"},
            "label": {"type": "plain_text", "text": "Due date", "emoji": True},
        },
    ],
}

step2_other_modal = {
    "type": "modal",
    "callback_id": "helpdesk-request-modal",
    "title": {"type": "plain_text", "text": "Helpdesk Request"},
    "submit": {"type": "plain_text", "text": "Submit"},
    "close": {"type": "plain_text", "text": "Close"},
    "blocks": [
        {
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": "You're making a request on your This may be a bit rare one. Please share the details with us as much as possible.",
            },
            "accessory": {
                "type": "button",
                "action_id": "helpdesk-request-modal-reset",
                "text": {"type": "plain_text", "text": "Back"},
                "value": "1",
            },
        },
        {
            "type": "input",
            "block_id": "title",
            "label": {"type": "plain_text", "text": "Title"},
            "element": {
                "type": "plain_text_input",
                "action_id": "element",
                "initial_value": "",
            },
        },
        {
            "type": "input",
            "block_id": "description",
            "label": {"type": "plain_text", "text": "Description"},
            "element": {
                "type": "plain_text_input",
                "action_id": "element",
                "multiline": True,
            },
        },
    ],
}


@app.shortcut("new-helpdesk-request")
def open_modal_step1(ack: Ack, body: dict, client: WebClient):
    ack()
    res = client.views_open(trigger_id=body["trigger_id"], view=step1_modal)


@app.action("helpdesk-request-modal-category-selection")
def show_modal_step2(ack: Ack, body: dict, action: dict, client: WebClient):
    ack()
    category = action["selected_option"]["value"]
    view = {}
    if category == "laptop":
        view = step2_laptop_modal
    elif category == "mobile":
        view = step2_mobile_modal
    else:
        view = step2_other_modal
    res = client.views_update(
        view_id=body["view"]["id"], hash=body["view"]["hash"], view=view
    )


@app.action("helpdesk-request-modal-reset")
def show_modal_step1_again(ack: Ack, body: dict, client: WebClient):
    ack()
    res = client.views_update(
        view_id=body["view"]["id"], hash=body["view"]["hash"], view=step1_modal
    )


@app.view("helpdesk-request-modal")
def accept_view_submission(ack: Ack, body: dict, logger: logging.Logger):
    values = body["view"]["state"]["values"]
    actionId = "element"
    title = values["title"][actionId]["value"] if "title" in values else None
    laptop_model = (
        values["laptop-model"][actionId]["selected_option"]["value"]
        if "laptop-model" in values
        else None
    )
    os = values["os"][actionId]["selected_option"]["value"] if "os" in values else None
    description = (
        values["description"][actionId]["value"] if "description" in values else None
    )
    due_date = (
        values["due-date"][actionId]["selected_date"] if "due-date" in values else None
    )
    approver = (
        values["approver"][actionId]["selected_user"] if "approver" in values else None
    )

    errors = {}
    if title is not None and len(title) <= 5:
        errors["title"] = "Title must be longer than 5 characters"
    if (
        due_date is not None
        and datetime.strptime(due_date, "%Y-%m-%d") <= datetime.today()
    ):
        errors["due-date"] = "Due date must be in the future"

    if len(errors) > 0:
        ack(response_action="errors", errors=errors)
        return

    ack()

    logger.info(
        f"title: {title}, "
        f"laptop_model: {laptop_model}, "
        f"os: {os}, "
        f"description: {description}, "
        f"due_date: {due_date}, "
        f"approver: {approver}"
    )


if __name__ == "__main__":
    app.start(port=3000)
