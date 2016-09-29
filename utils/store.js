var nohm = require('nohm').Nohm;
var redis = require("redis");

// nohm.model('User', {
//       properties: {
//         name: {
//           type: 'string',
//           unique: true,
//           validations: [
//             'notEmpty'
//           ]
//         },
//         email: {
//           type: 'string',
//           unique: true,
//           validations: [
//             'email'
//           ]
//         },
//       }
//     });



module.exports = {
  _instance: null,
  create: function () {
    if (!this._instance) {
      var _redis = redis.createClient();
      setImmediate(function() {
        nohm.setClient(_redis);
      });
      this._instance = _redis;
    }
  }
};


// echo "Starting local REDIS"
// pkill -f redis-server; sleep .5
// nohup redis-server &> $HOME/devenv/data/redis.log &


 // connections: {
 //    session: {
 //      host: '127.0.0.1',
 //      port: 6379,
 //      type: 'redis',
 //      db: 1
 //    },