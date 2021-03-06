const config = require('./config/config');
const express = require('express');
const app = express();
const basicAuth = require('express-basic-auth');
const dashbot = require('dashbot')(config.DASHBOT_API_KEY).google;
const bodyParser = require('body-parser');
const slackHelper = require('./slack_helper');
const request = require('request');
const DialogflowApp = require('actions-on-google').DialogflowApp;
// const transaction = require('./transaction');
 const orderUpdate = require('./order-update');
const Transactions = require('actions-on-google').Transactions.TransactionValues;
const OrderUpdate = require('actions-on-google').Transactions.OrderUpdate;

console.log('BotPopup initiated');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: false
}));

app.get('/', (request, response) => {
  response.send('hello world. but this is not the asdf');
});

app.post('/confirm_order', (req, response) => {
  let actionOrderId = '1234';
  //const rawPayload = JSON.parse(req.body.payload);
  //const payload = rawPayload.callback_id;
  console.log('Confirm order received', req.body);
  orderUpdate();
});

 app.use(basicAuth({
   users: {
     'admin': 'supersecret'
   }
 }));

app.post('/', (request, response) => {
  // Fullfillment endpoint DialogFlow calls after 'coffee_order' intent
  // It sends the order to slack and create the order in Google Actions Transactions
  console.log('Request', request.body);
  let dialogFlow = new DialogflowApp({ request, response });
  let order = dialogFlow.buildOrder('1234').setCart(dialogFlow.buildCart().setMerchant('test_merchant', 'Test Merchant'));
  console.log('Order created', order);
  var item, size = 'regular';
  switch (request.body.result.metadata.intentName) {
    case 'order_beverage':
      channel = 'beverage';
      item = request.body.result.parameters.beverages;
      size = ` size ${request.body.result.parameters.size}`;
      break;
    case 'order_food':
      channel = 'food';
      item = request.body.result.parameters.food;
      break;
    default:
      channel = 'orders';
      break;
  }
  const payload = request;
  slackHelper(channel, {
    "text": `A customer just ordered ${item} ${size}`,
    "attachments": [
      {
        "text": `${size}`
      },
      {
      "text": "Confirm Order?",
      "fallback": "Failed to confirm order",
      "callback_id": 'order_callback_id',
      "color": "#3AA3E3",
      "attachment_type": "default",
      "actions": [{
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
    }]
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

app.post('/talk_user', (request, response) => {
  console.log(request.body);
  response.end();
});

app.post('/cancel_order', (request, response) => {
  console.log(request.body);
});

app.use(basicAuth({
  users: {
    'admin': 'supersecret'
  }
}));

app.listen(config.HTTP_PORT, () => console.log(`BotPopup listening on port ${config.HTTP_PORT}!`))
