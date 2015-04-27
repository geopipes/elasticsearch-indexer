
var elastictest = require('elastictest'),
    indexer = require('../../index');

module.exports.tests = {};

// A simple test to ensure the server is running
module.exports.tests.running = function(test, common) {

  test('running', function(t) {

    var suite = new elastictest.Suite();

    // should save correctly
    suite.assert( function( done ){
      suite.client.info({}, function( err, res ){
        t.equal( res.status, 200, 'server is available' );
        done();
      });
    });

    suite.run( t.end );

  });
};

module.exports.all = function (tape, common) {

  function test(name, testFunction) {
    return tape('server: ' + name, testFunction);
  }

  for( var testCase in module.exports.tests ){
    module.exports.tests[testCase](test, common);
  }
};