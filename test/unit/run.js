
var tape = require('tape');
var common = {};

var tests = [
  require('./index'),
  require('./status'),
  require('./Batch'),
  require('./Operation'),
  require('./Transaction')
];

tests.map(function(t) {
  t.all(tape, common);
});