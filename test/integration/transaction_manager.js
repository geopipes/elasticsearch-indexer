
var elastictest = require('elastictest'),
    indexer = require('../../index');

module.exports.tests = {};

module.exports.tests.stream = function(test, common) {

  test('operationWriteStream', function(t) {

    var suite = new elastictest.Suite();

    suite.action( function( done ){

      var manager = new indexer.TransactionManager( suite.client, null, done );
      var stream = manager.operationWriteStream();

      stream.write( new indexer.Operation({ index : {
        _index : suite.props.index,
        _type : 'type1',
        _id : '1'
      }},{
        foo: 'bar'
      }));

      stream.end();

    });

    // should save correctly
    suite.assert( function( done ){
      suite.client.get({
        index: suite.props.index,
        type: 'type1',
        id: '1'
      }, function( err, res ){
        t.equal( res.found, true );
        t.equal( res._id, '1' );
        t.equal( res._index, suite.props.index );
        t.equal( res._type, 'type1' );
        t.deepEqual( res._source, { 'foo': 'bar' });
        t.equal( res._version, 1 );
        done();
      });
    });

    suite.run( t.end );

  });
};

module.exports.all = function (tape, common) {

  function test(name, testFunction) {
    return tape('transaction_manager: ' + name, testFunction);
  }

  for( var testCase in module.exports.tests ){
    module.exports.tests[testCase](test, common);
  }
};