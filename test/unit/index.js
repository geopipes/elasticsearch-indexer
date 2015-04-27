
var indexer = require('../../index');

module.exports.tests = {};

module.exports.tests.interface = function(test, common) {
  test('interface', function(t) {
    t.equal(typeof indexer.Batch, 'function', 'class');
    t.equal(typeof indexer.Operation, 'function', 'class');
    t.equal(typeof indexer.Transaction, 'function', 'class');
    t.equal(typeof indexer.createStream, 'function', 'stream factory');
    t.equal(typeof indexer.status, 'object', 'dictionary');
    t.end();
  });
  test('createStream()', function(t) {
    t.equal(typeof indexer.createStream, 'function', 'stream factory');
    t.equal(indexer.createStream.length, 2, 'accepts x args');
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