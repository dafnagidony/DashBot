var request = require('request-promise');
var http = require('http');
var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var path    = require('path');
var cache = require('memory-cache');
var utils = require('./utils');
var api = require('./api');

app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());

app.get('/webhook', function(req, res) {
  console.log('^^^^^^^^^', req.query);
  if (req.query['hub.mode'] === 'subscribe' &&
      req.query['hub.verify_token'] === process.env.VALIDATION_TOKEN) {
    console.log("Validating webhook");
    res.status(200).send(req.query['hub.challenge']);
  } else {
    console.error("Failed validation. Make sure the validation tokens match.");
    res.sendStatus(403);          
  }  
});

app.post('/webhook', function (req, res) {
  var data = req.body;
  console.log('&&&&&&&&&&&&&&&&&&&&&&&&&&&');
  // Make sure this is a page subscription
  if (data.object == 'page') {
    // Iterate over each entry
    // There may be multiple if batched
    data.entry.forEach(function(pageEntry) {
      var pageID = pageEntry.id;
      var timeOfEvent = pageEntry.time;

      // Iterate over each messaging event
      pageEntry.messaging.forEach(function(messagingEvent) {
        if (messagingEvent.optin) {
          receivedAuthentication(messagingEvent);
        } else if (messagingEvent.message) {
          utils.receivedMessage(messagingEvent);
        } else if (messagingEvent.delivery) {
          utils.receivedDeliveryConfirmation(messagingEvent);
        } else if (messagingEvent.postback) {
          utils.receivedPostback(messagingEvent);
        } else {
          console.log("Webhook received unknown messagingEvent: ", messagingEvent);
        }
        
      });
    });

    // Assume all went well.
    //
    // You must send back a 200, within 20 seconds, to let us know you've 
    // successfully received the callback. Otherwise, the request will time out.
    res.sendStatus(200);
  }

});

app.get('/authorize', function (req, res) {
  console.log('******', req.query);
  cache.put('account_linking_token', req.query.account_linking_token);
  cache.put('redirect_uri', req.query.redirect_uri);
  res.sendFile(path.join(__dirname+'/login_template.html'));
});

app.post('/outbrain_login', function(req, res) {
  var authCode = new Buffer(req.body.loginUsername+":"+req.body.loginPassword).toString('base64');
  var options = {
    url: "https://api.outbrain.com/amplify/v0.1/login",
    headers: {
      'Authorization': 'Basic ' + authCode,
      'Content-Length':0
    }
  };
  request(options)
  .then(function(resp) {
    cache.put('obToken', resp);
    obToken = resp;
    console.log('(((&&&&&', resp);
    api.getMarketers(obToken).then(function(accounts) {
      console.log('--------', accounts);
      cache.put('authorization_code', 'ZWI3NDYyYjc1MjViNW5MTNiNWM4NQ0ZTViZTZ');
      var redirectPath = cache.get('redirect_uri')+ '&authorization_code='+cache.get('authorization_code');
      res.redirect(redirectPath);    
    });
    
  })
  .catch(function(err) {
    res.sendFile(path.join(__dirname+'/login_template_error.html'));
  });

});

app.listen(3000, function () {
  console.log('Example app listening on port 3000!');
});
