var requestHelper = require('../utils/request');


/**
 * @function getMarketers Gets a list of marketers
 * @returns {object} Returns a promise.
 * @public
 */
module.exports.getMarketers = function getMarketers(obToken) {
  return requestHelper({url: '/marketers', obToken: obToken});
};

/**
 * @function getBudgets Gets a list of budgets
 * @param {string} marketerId The marketer ID to get budgets for
 * @returns {object} Returns a promise.
 * @public
 */
module.exports.getBudgets = function(marketerId) {
  return requestHelper({url: `/marketers/${marketerId}/budgets`});
};

/**
 * @function getCampaigns Gets a list of campaigns
 * @param {string} marketerId The marketer ID to get campaigns for
 * @param {boolean=} includeArchived Whether or not to return archived campaigns (default: false)
 * @param {string} fetch Indicates the size of the payload to return, can be either 'basic' or 'all' (default: 'all') 
 * @returns {object} Returns a promise.
 * @public
 */
module.exports.getCampaigns = function(obToken, marketerId, includeArchived, fetch) {
  includeArchived = includeArchived || false;
  fetch = fetch || 'all';
  return requestHelper({url: `/marketers/${marketerId}/campaigns`, qs: {includeArchived, fetch}, obToken: obToken});
};

/**
 * @function getPerformanceByDay
 * @param {string} campaignId The campaign ID to get performance metrics for
 * @param {object} params
 * @param {string} params.from The start date (format: YYYY-MM-DD)
 * @param {string} params.to The end date (format: YYYY-MM-DD)
 * @param {number=} params.limit The number of results to return (default: 10)
 * @param {string=} params.sort 'ctr', 'impressions', 'cost', 'clicks', 'date', prepended with a '+' (descending) or a '-' (ascending) (default: '+date')
 * @returns {object} Returns a promise.
 * @public
 */
module.exports.getPerformanceByDay = function getPerformanceByDay(obToken, campaignId, params) {
  params.limit = params.limit || 10;
  params.sort = params.sort || '+date';
  return requestHelper({url: `/campaigns/${campaignId}/performanceByDay`, qs: params, obToken: obToken});
};

/**
 * @function updateBudget Update an existing budget
 * @param {string} budgetId The budget ID to update
 */
module.exports.updateBudget = function updateBudget(budgetId, amount) {
  const endDate = moment().add(1, 'days').format('YYYY-MM-DD');
  return requestHelper({url: `/budgets/${budgetId}`, method: 'PUT', headers: {'Content-Type': 'application/json'}, json: {amount, endDate} });
};
