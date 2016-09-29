var nohm = require('nohm').Nohm;

/**
 * @class UserModel
 * @desc UserModel Nohm constructor
 */
module.exports = nohm.model('User', {
  properties: {
    created_on: {
      type: 'string'
    },
    name: {
      type: 'string',
      unique: true,
      index: true
    },
    full_name: {
      type: 'string'
    },
    email: {
      type: 'string',
      validations: [
        'email'
      ],
      index: true
    },
    salty_password: {
      type: 'string'
    },
    role: {
      type: 'string'
    },
    permissions: {
      type: 'json'
    },
    preferences: {
      type: 'json'
    },
    phone: {
      type: 'string'
    },
    publisher_id: {
      type: 'integer'
    },
    enabled_features: {
      type: 'json'
    },
    screens: {
      type: 'json'
    },
    two_auth: {
      type: 'boolean'
    },
    vr_user: {
      type: 'boolean'
    },
    vr_staff: {
      type: 'boolean'
    }
  },
  methods: {
    getSnapshot: function() {
      var snapshot = {};
      var prop;
      // iterate over props
      for (prop in this.properties) {
        // parse json string if needed
        if (this.properties[prop].type === 'json') {
          this.properties[prop].value = JSON.parse(this.properties[prop].value);
        }
        snapshot[prop] = this.properties[prop].value;
      }
      return snapshot;
    }
  }
});
