
var tape = require('tape');
var common = {};

var tests = [
  require('./server'),
  require('./transaction'),
  require('./transaction_manager')
];

tests.map(function(t) {
  t.all(tape, common);
});