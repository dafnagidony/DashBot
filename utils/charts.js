var quiche = require('quiche');

module.exports.getLineChart = function getLineChart(data) {
  var chart = quiche('line');
  var _clicks = [];
  var _cost = [];
  var _xAxisData = [];

  data.forEach(function(date) {
    _clicks.push(date.clicks);
    _cost.push(date.cost);
    var _date = date.date.split('-');
    _date.shift();
    _xAxisData.push((+_date[0]) + '-' + (+_date[1]));
  });

  chart.addData(_clicks, 'Clicks', '1e9f97');
  chart.addData(_cost, 'Spent', '6c498c');
  chart.addAxisLabels('x', _xAxisData);
  chart.setAutoScaling();

  return chart.getUrl();
};
