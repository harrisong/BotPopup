const config = require('./config/config');
const express = require('express');
const app = express();
const basicAuth = require('express-basic-auth');
const dashbot = require('dashbot')(config.DASHBOT_API_KEY).google;
const bodyParser = require('body-parser');
const slackHelper = require('./slack_helper');

console.log('BotPopup initiated');

app.use(basicAuth({
  users: { 'admin': 'supersecret' }
}));

app.use(bodyParser.json());

app.get('/', (request, response) => {
  response.send('hello world. but this is not the asdf');
});

app.post('/', (request, response) => {
  slackHelper({
    "text": "A customer just ordered a coffee. Please confirm.",
    "attachments": [
        {
            "text": "Confirm Order?",
            "fallback": "Failed to confirm order",
            "callback_id": "order_confirm_id",
            "color": "#3AA3E3",
            "attachment_type": "default",
            "actions": [
                {
                    "name": "order",
                    "text": "Confirm",
                    "type": "button",
                    "value": "confirm"
                },
                {
                    "name": "order",
                    "text": "Cancel",
                    "style": "danger",
                    "type": "button",
                    "value": "cancel",
                    "confirm": {
                        "title": "Are you sure?",
                        "text": "The customer will be very dissapointed... :(",
                        "ok_text": "Yes",
                        "dismiss_text": "No"
                    }
                }
            ]
        }
    ]
});
  dashbot.logIncoming(request.body);
  const sampleResponse = {
    speech: "Thanks, you order has been received.",
    displayText: "Thanks, you order has been received.",
    data: {},
    contextOut: [],
    source: ""
  }
  dashbot.logOutgoing(request.body, sampleResponse);
  response.json(sampleResponse);
});

app.post('/confirm_order', (request, response) => {
  console.log(request);
});

app.listen(config.HTTP_PORT, () => console.log(`BotPopup listening on port ${config.HTTP_PORT}!`))
