
var indexer = require('../../index');

module.exports.tests = {};

module.exports.tests.interface = function(test, common) {
  test('interface', function(t) {
    t.equal(typeof indexer.Batch, 'function', 'class');
    t.equal(typeof indexer.Concurrency, 'function', 'class');
    t.equal(typeof indexer.Operation, 'function', 'class');
    t.equal(typeof indexer.Transaction, 'function', 'class');
    t.equal(typeof indexer.TransactionManager, 'function', 'class');
    t.equal(typeof indexer.status, 'object', 'dictionary');
    t.end();
  });
};

module.exports.all = function (tape, common) {

  function test(name, testFunction) {
    return tape('index: ' + name, testFunction);
  }

  for( var testCase in module.exports.tests ){
    module.exports.tests[testCase](test, common);
  }
};