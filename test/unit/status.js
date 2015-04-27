
var status = require('../../lib/status');

module.exports.tests = {};

module.exports.tests.interface = function(test, common) {
  test('interface', function(t) {
    t.equal(typeof status, 'object', 'dictionary');
    t.equal(Object.keys(status).length, 5, 'status codes defined');
    t.end();
  });
};

module.exports.all = function (tape, common) {

  function test(name, testFunction) {
    return tape('status: ' + name, testFunction);
  }

  for( var testCase in module.exports.tests ){
    module.exports.tests[testCase](test, common);
  }
};