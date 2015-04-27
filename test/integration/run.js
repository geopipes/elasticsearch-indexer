
var tape = require('tape');
var common = {};

var tests = [
  require('./server'),
  require('./transaction')
];

tests.map(function(t) {
  t.all(tape, common);
});