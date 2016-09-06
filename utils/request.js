var constants = require('../constants');
var request = require('request-promise');
var merge = require('lodash.merge');

module.exports = function(optionsInput) {
	options = merge({}, {json: true, headers: JSON.parse(optionsInput.obToken)}, optionsInput);
  options.url = constants.AMPLIFY_API_URL + optionsInput.url;
  return request(options);
};
