const config = require('./config/config');
const express = require('express');
const app = express();
const basicAuth = require('express-basic-auth');
const dashbot = require('dashbot')(config.DASHBOT_API_KEY).google;
const bodyParser = require('body-parser');
const slackHelper = require('./slack_helper');
const request = require('request');

console.log('BotPopup initiated');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: false
}));

app.get('/', (request, response) => {
  response.send('hello world. but this is not the asdf');
});

app.post('/confirm_order', (req, response) => {
  response.json({
    'text': 'Order confirmed'
  });

  const messageToGA = {
    event:{
      name: "talk_user",
      data:{
        merchant_action: "confirm"
      },
      timezone: "America/New_York",
      lang: "en",
      sessionId: req.callback_id,
    }
  };

  request.post(
    {
      method: 'POST',
      url: config.DIALOGFLOW_URL,
      headers: {
        'Authorization': `Bearer ${config.DIALOGFLOW_ACCESS_TOKEN}`,
        'content-type': 'application/json'
      },
      body: JSON.stringify(messageToGA)
    },
    (error, response, body) => {
      if (!error && response.statusCode == 200) {
        console.log('success');
        console.log(body)
      } else {
        console.error('error');
        console.error(error);
      }
    }
  );
});

app.use(basicAuth({
  users: { 'admin': 'supersecret' }
}));

app.post('/', (request, response) => {
  const sessionId = request.body.sessionId;
  slackHelper({
    "text": "A customer just ordered a coffee. Please confirm.",
    "attachments": [
      {
        "text": "Confirm Order?",
        "fallback": "Failed to confirm order",
        "callback_id": sessionId,
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

app.post('/talk_user', (request, response) => {
  console.log(request.body);
  response.end();
});

app.post('/cancel_order', (request, response) => {
  console.log(request.body);
});

app.use(basicAuth({
  users: { 'admin': 'supersecret' }
}));

app.listen(config.HTTP_PORT, () => console.log(`BotPopup listening on port ${config.HTTP_PORT}!`))
