var request = require('request-promise');
var cache = require('memory-cache');
var moment = require('moment');
var api = require('../api');
var charts = require('./charts');

module.exports.receivedMessage = function(event){
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;
  var timeOfMessage = event.timestamp;
  var message = event.message;
  

  console.log("Received message for user %d and page %d at %d with message:", 
    senderID, recipientID, timeOfMessage);
  console.log(JSON.stringify(message));

  if (message.quick_reply) {
    var messagePayload = message.quick_reply.payload;
    if (message.quick_reply.payload.search("marketersSelect") !== -1) {
      cache.put('marketer', message.text);
      sendSelectCampaignMessage(senderID, message.text);
    } else if (message.quick_reply.payload.search("campaignSelect") !== -1) {
      cache.put('campaign', message.text);
      sendSelectDateRangeMessage(senderID);
    } else if (message.quick_reply.payload.search("dateSelect") !== -1) {
      cache.put('date', message.text);
      sendSelectReportSelectMessage(senderID);
    } else if (message.quick_reply.payload.search("reportSelect") !== -1) {
      cache.put('report', message.text);
      if (message.text === 'Overview') {
        sendOverviewReport(senderID);
      } else {
        sendTrendlineReport(senderID);
      }
    }
  }

  var messageId = message.mid;
  var messageText = message.text;
  var messageAttachments = message.attachments;

}


function sendImageMessage(recipientId, url) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message:{
      attachment:{
        type: "image",
        payload:{
          url: url
        }
      }
    }
  };

  return callSendAPI(messageData);
}


function sendTextMessage(recipientId, messageText) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      text: messageText
    }
  };

  return callSendAPI(messageData);
}

function sendButtonMessage (recipientId) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      attachment: {
        type: "template",
        payload: {
          template_type: "generic",
          elements: [{

            title: "*image*",
            buttons: [{
              type: "account_link",
              url: process.env.APP_URL + "/authorize"
            }]
          }]
        }
      }
    }
  };
  return callSendAPI(messageData);
}

function sendGenericMessage(recipientId, elements) {
   var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      attachment: {
        type: "template",
        payload: {
          template_type: "generic",
          elements: [elements]
        }
      }
    }
  };
  return callSendAPI(messageData);
}

function sendQuickReplies(recipientId, message, quick_replies) {
   var messageData = {
    recipient: {
      id: recipientId
    },
    message:{
    text: message,
    quick_replies: quick_replies
  }
  };
  return callSendAPI(messageData);
}

function callSendAPI(messageData) {
  return request({
    url: 'https://graph.facebook.com/v2.6/me/messages',
    qs: { access_token: process.env.PAGE_ACCESS_TOKEN },
    method: 'POST',
    body: messageData,
    json: true
  })
  .then(function(resp) {
   console.log("Successfully sent generic message", messageData);
   return Promise.resolve();
  })
  .catch(function(err) {
    console.log("ERROR sent generic message", messageData);
    return Promise.reject('error');
  });
}

module.exports.receivedDeliveryConfirmation = function(event) {
  console.log('___ message delivery confirmation  ', event);
}

module.exports.receivedPostback = function(event) {
  var senderID = event.sender.id;
  var action = event.postback.payload;
  var actions = {
    "get_started": get_started_action,
    "accountSettings": accountSettings_action
  };
  console.log('+++++++ receivedPostback  ', event);
  actions[action](senderID);
  
}

module.exports.receivedAccountLinking = function(event) {
  var senderID = event.sender.id;
  console.log('Recieved account_link event:  ', event);
  if (event.account_linking.status === "linked" && event.account_linking.authorization_code == cache.get('authorization_code')) {
    cache.put('psid', event.sender.id);
    cache.put('authenticated', true);
    console.log('*** ACCOUT IS LINKED!!!!');
    sendTextMessage(senderID, "You Successfully logged in.")
      .then(function() {
        sendSelectAccountMessage(senderID);
      });
  }  
  if (event.account_linking.status === "unlinked") {
    cache.put('authenticated', false);
    console.log('*** ACCOUT IS UNLINKED ****');
  } 
}


function get_started_action(senderID) {
  request({url: 'https://graph.facebook.com/v2.6/'+senderID+'?access_token='+process.env.PAGE_ACCESS_TOKEN, json:true})
  .then(function(resp) { 
    cache.put('first_name', resp.first_name);
    if (cache.get('authenticated') !== true) {
      var elements = {   
        title: "Hi " + resp.first_name + ",",
        subtitle: "Welcome to Dashbot by Outbrain. Login to your Amplify Account.",
        image_url: "https://v.cdn.vine.co/v/avatars/ACDDB8BB-2FEB-4FBF-9BA3-BE0491ECC293-8626-00000757443D2912.jpg?versionId=FfPJrFoJlQsXqJZsYc3bPmdQDuq9i2lq",
        buttons: [{
          type: "account_link",
          url: process.env.APP_URL + "/authorize"
        }]
      };
      sendGenericMessage(senderID, elements);
    } else {
      var elements = {   
        title: "Welcome back " + resp.first_name + "!",  
        image_url: "https://v.cdn.vine.co/v/avatars/ACDDB8BB-2FEB-4FBF-9BA3-BE0491ECC293-8626-00000757443D2912.jpg?versionId=FfPJrFoJlQsXqJZsYc3bPmdQDuq9i2lq"
      };
      sendGenericMessage(senderID, elements)
        .then(function() {
          sendSelectAccountMessage(senderID);
        }); 
    }        
  });
}

function sendSelectAccountMessage(senderID) {
  obToken = cache.get('obToken');
  api.getMarketers(obToken).then(function(marketers) {
    var quick_replies = [];
    var accountObj = {};
    for (var i = 0; i< marketers.count; i++) {
      accountObj[marketers.marketers[i].name] = marketers.marketers[i].id;
      var reply = {
        content_type:"text",
        title: marketers.marketers[i].name,
        payload: "marketersSelect"
      };
      quick_replies.push(reply);
    }
    cache.put('accountLookup', accountObj);
    var message = "Pleae select an account:";
    sendQuickReplies(senderID, message, quick_replies);
  });
}

function containsNonLatinCodepoints(s) {
    return /[^\u0000-\u00ff]/.test(s);
}

function sendSelectCampaignMessage(senderID, account) {
  var obToken = cache.get('obToken'),
  accountObj = cache.get('accountLookup'),
  marketerId = accountObj[account];
  api.getCampaigns(obToken, marketerId).then(function(campaigns) {
    var quick_replies = [];
    var campaignObj = {};
    for (var i = 0; i< campaigns.count; i++) {
      var campaignName = campaigns.campaigns[i].name;
      if (!containsNonLatinCodepoints(campaignName)) {
        campaignObj[campaignName] = campaigns.campaigns[i].id;
        var reply = {
          content_type:"text",
          title: campaignName,
          payload: "campaignSelect"
        };
        quick_replies.push(reply);
      }
    }
    var message = "Please select campaign:";
    cache.put('campaignLookup', campaignObj);
    sendQuickReplies(senderID, message, quick_replies);
  });
}

function sendSelectDateRangeMessage(senderID) {
  var quick_replies =[{
      content_type:"text",
      title: "yesterday",
      payload: "dateSelect"
    },
    {
      content_type:"text",
      title: "last week",
      payload: "dateSelect"
    },
    {
      content_type:"text",
      title: "today",
      payload: "dateSelect"
    },
    {
      content_type:"text",
      title: "month to date",
      payload: "dateSelect"
    },
    {
      content_type:"text",
      title: "campaign to date",
      payload: "dateSelect"
    }];

        
  var message = "Select spend's date range:";
  sendQuickReplies(senderID, message, quick_replies);
}


function sendSelectReportSelectMessage(senderID) {
  var quick_replies =[
    {
      content_type:"text",
      title: "Overview",
      payload: "reportSelect"
    },
    {
      content_type:"text",
      title: "Trendline",
      payload: "reportSelect"
    }
  ];
  var message = "What do you want to check?";
  sendQuickReplies(senderID, message, quick_replies);
}

function sendOverviewReport(senderID) {
  var obToken = cache.get('obToken');
  var campaignObj = cache.get('campaignLookup');
  var campaignName = cache.get('campaign');
  var campaignId = campaignObj[campaignName];
  console.log('***&*&*&*&*&', campaignObj, campaignName, campaignId);
   var date = cache.get('date');
   var fromDate;
  switch(date) {
    case "yesterday":
      fromDate = moment().subtract(1, 'days');
    case "last week":
      fromDate = moment().subtract(7, 'days');
    case "today":
      fromDate = moment();
    case "month to date":
      fromDate = moment().subtract(30,'days');
    case "campaign to date":
      fromDate = moment().subtract(30,'days');
    //  fromDate = global.userFlowMap[message.from].campaigns[campaign_name].creationTime;
    default:
      fromDate = moment().subtract(1, 'days');
  }
  console.log('&&& date:   ', date, fromDate);
   var params = {from: fromDate.format('YYYY-MM-DD'), to: moment().format('YYYY-MM-DD')};
   console.log('^^^^^^^', date, params);
   return api.getPerformanceByDay(obToken, campaignId, params).then(function(data) {
     console.log('#####$$$', data);
   });
}

function sendTrendlineReport(senderID) {
  var data = require('../data/weekly_performance.json');
  console.log('&&&&&&&', data.details);
  sendImageMessage(senderID, charts.getLineChart(data.details));
}

//     var text = "Here's summary for " + campaign_name +
//      "\n cost: " + data.overallMetrics.cost + 
//       "\n cpa: " + data.overallMetrics.cpa + 
//       "\n ctr: " + data.overallMetrics.ctr + 
//       "\n cpa: " + data.overallMetrics.cpa + 
//       "\n clicks: " + data.overallMetrics.clicks + 
//       "\n impressions: " + data.overallMetrics.impressions;
// charts.getLineChart(require('../data/weekly_performance.json')

function accountSettings_action(senderID) {
  var elements = {   
      title: "Your Outbrain account settings", 
      image_url: "https://v.cdn.vine.co/v/avatars/ACDDB8BB-2FEB-4FBF-9BA3-BE0491ECC293-8626-00000757443D2912.jpg?versionId=FfPJrFoJlQsXqJZsYc3bPmdQDuq9i2lq",
      buttons: [
        {
          "type":"web_url",
          "url":"https://outbrain.com",
          "title":"Settings"
        },
      ]
    };
    if (cache.get('authenticated') === true) {
      elements.buttons.unshift({type: "account_unlink"});
    } else {
      elements.buttons.unshift({type: "account_link", url: process.env.APP_URL + "/authorize"});
    }
    sendGenericMessage(senderID, elements);

}

// curl -X POST -H "Content-Type: application/json" -d '{
//   "setting_type":"greeting",
//   "greeting":{
//     "text":"Need access to your Amplify dashboard from anywhere at any time? Here’s a new, quick and easy way to update your campaigns on the go! \r\n Click below to get started."
//   }
// }' "https://graph.facebook.com/v2.6/me/thread_settings?access_token=EAAIP954xVOYBANLuF7I2BRcM1q1BGLFs7O8HMbXVJBIEK52ZBQ93RRz0rul4Mdo7FvS1O7RhkgO57LNxSJbprYYenUxIS0xhjmx5VzydZATK5ZATiZCJOv89vLQeIMaNwYoIz3XoGw15MHvrr1BKvkV6NCWOZBS6hpVefejniDgZDZD"        

// curl -X POST -H "Content-Type: application/json" -d '{
//   "setting_type":"call_to_actions",
//   "thread_state":"new_thread",
//   "call_to_actions":[
//     {
//       "payload":"get_started"
//     }
//   ]
// }' "https://graph.facebook.com/v2.6/me/thread_settings?access_token=EAAIP954xVOYBANLuF7I2BRcM1q1BGLFs7O8HMbXVJBIEK52ZBQ93RRz0rul4Mdo7FvS1O7RhkgO57LNxSJbprYYenUxIS0xhjmx5VzydZATK5ZATiZCJOv89vLQeIMaNwYoIz3XoGw15MHvrr1BKvkV6NCWOZBS6hpVefejniDgZDZD"      

// curl -X POST -H "Content-Type: application/json" -d '{
//   "setting_type" : "call_to_actions",
//   "thread_state" : "existing_thread",
//   "call_to_actions":[
//     {
//       "type":"postback",
//       "title":"Account Settings",
//       "payload":"accountSettings"
//     },
//       {
//       "type":"web_url",
//       "title":"Help",
//       "url":"https://www.outbrain.com/"
//     },
//   ]
// }' "https://graph.facebook.com/v2.6/me/thread_settings?access_token=EAAIP954xVOYBANLuF7I2BRcM1q1BGLFs7O8HMbXVJBIEK52ZBQ93RRz0rul4Mdo7FvS1O7RhkgO57LNxSJbprYYenUxIS0xhjmx5VzydZATK5ZATiZCJOv89vLQeIMaNwYoIz3XoGw15MHvrr1BKvkV6NCWOZBS6hpVefejniDgZDZD"