var request = require('request-promise');
var http = require('http');
var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var cheerio = require('cheerio');
var Mustache = require('mustache');
var querystring = require('querystring');
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

	var j = request.jar();
  var j2 = request.jar();

  request({
    url: 'https://my.outbrain.com/login',
    jar: j,
    headers: {
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/47.0.2526.73 Safari/537.36'
    }
  }, function(error, response, body) {
  	var options = {
    uri: 'https://my.outbrain.com/login',
    transform: function (body) {
        return cheerio.load(body);
    }
	};
	request(options)
    .then(function ($) {
      var csrf_code = $('input[name="csrf"]').prop('value');
      var cookie_string = j.getCookieString('https://my.outbrain.com/login');
      console.log('+++ cookie string: ', cookie_string);
      request({
        url: 'https://my.outbrain.com/login',
        jar: j2,
        method: 'POST',
        body: 'submitted=true&csrf=csrf_code&loginUsername=dgidony@outbrain.com&loginPassword=1qazse4$E&rememberMe=true&__checkbox_rememberMe=true',
        headers: {
          
          'Accept': '*/*',
          'Accept-Encoding': 'gzip, deflate',
          'Accept-Language': 'en-US,en;q=0.8,it;q=0.6',
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          'Cookie': cookie_string,
          'Origin': 'https://my.outbrain.com/login',
          'Referer': 'https://my.outbrain.com/login',
          'User-Agent': 'request',
        
          'X-Requested-With': 'XMLHttpRequest'
        }
      }, function(error, response, body) {
      	console.log('!!!! ', j2.getCookieString('https://my.outbrain.com/login'));
      	res.send(body);

			});
  });

});
    /*    var output = Mustache.render(loginHtml, {csrf: csrf_code});
        res.send(output);
   //   var login_template = $.html();
    //  var form_action = $('form').attr('action');
    //  $('form').attr('action', '/outbrain_login');
    //  res.send($.html());
    });
*/
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
