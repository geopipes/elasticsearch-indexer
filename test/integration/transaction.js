
var elastictest = require('elastictest'),
    indexer = require('../../index');

module.exports.tests = {};

/**
  Integration Tests
  -----------------

  These tests are run against a live instance of the elasticsearch
  API in order to ensure compatibility with the bulk indexing APIs.

  @ref: http://www.elastic.co/guide/en/elasticsearch/reference/current/docs-bulk.html
**/

module.exports.tests.create = function(test, common) {

  test('create', function(t) {

    var suite = new elastictest.Suite();
    var batch = new indexer.Batch();

    // index version:1 of id:1
    suite.action( function( done ){

      batch.push( new indexer.Operation({ index : {
        _index : suite.props.index,
        _type : 'type1',
        _id : '1'
      }},{
        foo: 'bar'
      }));

      var transaction = new indexer.Transaction( batch );
      transaction.commit( suite.client, done );
    });

    // should return status:201
    suite.assert( function( done ){
      t.equal( batch._operations[0]._status, 201 );
      t.equal( batch._status, 201 );
      done();
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

module.exports.tests.index = function(test, common) {

  test('index', function(t) {

    var suite = new elastictest.Suite();
    var batch = new indexer.Batch();

    // index version:1 of id:1
    suite.action( function( done ){
      suite.client.index({
        index: suite.props.index,
        type: 'type1',
        id: '1',
        body: {
          foo: 'bar'
        }
      }, done );
    });

    // update version:2 of id:1
    suite.action( function( done ){
 
      batch.push( new indexer.Operation({ index : {
        _index : suite.props.index,
        _type : 'type1',
        _id : '1'
      }},{
        bing: 'bang'
      }));

      var transaction = new indexer.Transaction( batch );
      transaction.commit( suite.client, done );
    });

    // should return status:200
    suite.assert( function( done ){
      t.equal( batch._operations[0]._status, 200 );
      t.equal( batch._status, 200 );
      done();
    });

    // should update _source
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
        t.deepEqual( res._source, { 'bing': 'bang' });
        t.equal( res._version, 2 );
        done();
      });
    });

    suite.run( t.end );

  });
};

module.exports.tests.delete = function(test, common) {

  test('delete', function(t) {

    var suite = new elastictest.Suite();
    var batch = new indexer.Batch();

    // index version:1 of id:1
    suite.action( function( done ){
      suite.client.index({
        index: suite.props.index,
        type: 'type1',
        id: '1',
        body: {
          foo: 'bar'
        }
      }, done );
    });

    // delete id:1
    suite.action( function( done ){

      batch.push( new indexer.Operation({ delete : {
        _index : suite.props.index,
        _type : 'type1',
        _id : '1'
      }}));

      var transaction = new indexer.Transaction( batch );
      transaction.commit( suite.client, done );
    });

    // should return status:200
    suite.assert( function( done ){
      t.equal( batch._operations[0]._status, 200 );
      t.equal( batch._status, 200 );
      done();
    });

    // should delete record
    suite.assert( function( done ){
      suite.client.get({
        index: suite.props.index,
        type: 'type1',
        id: '1'
      }, function( err, res ){
        t.equal( res.found, false );
        done();
      });
    });

    suite.run( t.end );

  });
};

module.exports.tests.delete_not_existing = function(test, common) {

  test('delete not existing record', function(t) {

    var suite = new elastictest.Suite();
    var batch = new indexer.Batch();

    // delete id:1
    suite.action( function( done ){

      batch.push( new indexer.Operation({ delete : {
        _index : suite.props.index,
        _type : 'type1',
        _id : '1'
      }}));

      var transaction = new indexer.Transaction( batch );
      transaction.commit( suite.client, done );
    });

    // should return status:404
    suite.assert( function( done ){
      t.equal( batch._operations[0]._status, 404 );
      t.equal( batch._status, 404 );
      done();
    });

    suite.run( t.end );

  });
};

module.exports.tests.update = function(test, common) {

  test('update', function(t) {

    var suite = new elastictest.Suite();
    var batch = new indexer.Batch();

    // index version:1 of id:1
    suite.action( function( done ){
      suite.client.index({
        index: suite.props.index,
        type: 'type1',
        id: '1',
        body: {
          foo: 'bar'
        }
      }, done );
    });

    // update id:1
    suite.action( function( done ){

      batch.push( new indexer.Operation({ update : {
        _index : suite.props.index,
        _type : 'type1',
        _id : '1'
      }},{
        doc: {
          bing: 'bang'
        }
      }));

      var transaction = new indexer.Transaction( batch );
      transaction.commit( suite.client, done );
    });

    // should return status:200
    suite.assert( function( done ){
      t.equal( batch._operations[0]._status, 200 );
      t.equal( batch._status, 200 );
      done();
    });

    // should partially update _source (add new fields)
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
        t.deepEqual( res._source, { 'foo': 'bar', 'bing': 'bang' });
        t.equal( res._version, 2 );
        done();
      });
    });

    suite.run( t.end );

  });
};

module.exports.tests.update_not_existing = function(test, common) {

  test('update not existing record', function(t) {

    var suite = new elastictest.Suite();
    var batch = new indexer.Batch();

    // update id:1
    suite.action( function( done ){

      batch.push( new indexer.Operation({ update : {
        _index : suite.props.index,
        _type : 'type1',
        _id : '1'
      }},{
        doc: {
          bing: 'bang'
        }
      }));

      var transaction = new indexer.Transaction( batch );
      transaction.commit( suite.client, done );
    });

    // should return status:404
    suite.assert( function( done ){
      t.equal( batch._operations[0]._status, 404 );
      t.equal( batch._status, 404 );
      done();
    });

    suite.run( t.end );

  });
};


module.exports.tests.invalid_action = function(test, common) {

  test('invalid action', function(t) {

    var suite = new elastictest.Suite();
    var batch = new indexer.Batch();

    // execute an invalid action
    suite.action( function( done ){

      batch.push( new indexer.Operation({ invalid_action : {
        _index : suite.props.index,
        _type : 'type1',
        _id : '1'
      }},{
        bing: 'bang'
      }));

      var transaction = new indexer.Transaction( batch );
      transaction.commit( suite.client, done );
    });

    // should return status:500
    suite.assert( function( done ){
      t.equal( batch._operations[0]._status, 999 );
      t.equal( batch._status, 500 );
      done();
    });

    suite.run( t.end );

  });
};

module.exports.all = function (tape, common) {

  function test(name, testFunction) {
    return tape('transaction: ' + name, testFunction);
  }

  for( var testCase in module.exports.tests ){
    module.exports.tests[testCase](test, common);
  }
};