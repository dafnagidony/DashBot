var request = require('request-promise');
var http = require('http');
var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var cheerio = require('cheerio');
var Mustache = require('mustache');
var utils = require('./utils');
var loginHtml = require('./login_template');

app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());

app.get('/', function (req, res) {
  res.send('Hello World!');
});


app.get('/webhook', function(req, res) {
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
	console.log('&&&&&', req.query);
	var options = {
    uri: 'https://my.outbrain.com/login',
    transform: function (body) {
        return cheerio.load(body);
    }
	};
	request(options)
    .then(function ($) {
        var csrf_code = $('input[name="csrf"]').prop('value');
        var output = Mustache.render(loginHtml, {csrf: csrf_code});
        res.send(output);
   //   var login_template = $.html();
    //  var form_action = $('form').attr('action');
    //  $('form').attr('action', '/outbrain_login');
    //  res.send($.html());
    });
});


app.post('/outbrain_login', function(req, res) {
	var options = {
		method: 'POST',
    uri: "https://my.outbrain.com/login",
    form: req.body,
    headers: {
         'content-type': 'application/x-www-form-urlencoded'
    },
    transform: function (body) {
        return cheerio.load(body);
    }
	};
	console.log('~~~~~~~', options);
	request(options)
    .then(function ($) {

    	console.log($('div[class="msg-error"]').html());
  		console.log($('div[class="error-message"]').html());
  
  //  	console.log($('form[id="signin-member"]').html());
 //   console.log($.html());
    	res.send($.html());
    });
});

app.listen(3000, function () {
  console.log('Example app listening on port 3000!');
});
