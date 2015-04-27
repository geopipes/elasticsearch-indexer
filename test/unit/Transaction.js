
var util = require('util');
var Transaction = require('../../lib/Transaction');
var Operation = require('../../lib/Operation');
var Batch = require('../../lib/Batch');
var status = require('../../lib/status');

module.exports.tests = {};

module.exports.tests.interface = function(test, common) {
  test('class interface', function(t) {
    t.equal(typeof Transaction, 'function', 'valid class');
    t.equal(typeof Transaction.prototype, 'object', 'valid proto');
    t.end();
  });
  test('object methods', function(t) {
    t.equal(typeof Transaction.payload, 'function', 'valid method');
    t.equal(typeof Transaction.updateBatch, 'function', 'valid method');
    t.end();
  });
  test('prototype methods', function(t) {
    t.equal(typeof Transaction.prototype.commit, 'function', 'valid method');
    t.end();
  });
};

module.exports.tests.constructor = function(test, common) {
  test('constructor - invalid batch', function(t) {
    t.throws(function(){
      var transaction = new Transaction();
      t.equals( transaction.batch, undefined, 'object property not set' );
    });
    t.end();
  });
  test('constructor - valid batch', function(t) {
    var batch = new Batch();
    var transaction = new Transaction( batch );
    t.equals( transaction.batch, batch, 'object property set' );
    t.end();
  });
  test('constructor - default options', function(t) {
    var batch = new Batch();
    var transaction = new Transaction( batch );
    t.deepEquals( transaction.opts, {
      max_retries: 5
    }, 'default options set' );
    t.end();
  });
  test('constructor - override options', function(t) {
    var batch = new Batch();
    var transaction = new Transaction( batch, { max_retries: 1, foo: 'bar' } );
    t.deepEquals( transaction.opts, {
      max_retries: 1,
      foo: 'bar'
    }, 'overridden options set' );
    t.end();
  });
};

module.exports.tests.payload = function(test, common) {
  test('Transaction.payload - mapping', function(t) {
    
    var operation1 = new Operation( 'action', 'source' );
    operation1.setStatus(999); // should be included by Transaction.payload()

    var operation2 = new Operation( 'action', 'source' );
    operation2.setStatus(0); // should be excluded by Transaction.payload()

    var batch = new Batch();
    batch.push( operation1 );
    batch.push( operation2 );
    
    var payload = Transaction.payload( batch );
    t.deepEqual( payload, [ 'action', 'source' ] );
    t.end();
  });
};

module.exports.tests.commit = function(test, common) {
  test('commit - invalid client', function(t) {
    var batch = new Batch();
    var transaction = new Transaction( batch );
    t.throws(function(){
      transaction.commit();
    });
    t.end();
  });
  test('commit - invalid callback', function(t) {
    var batch = new Batch();
    var transaction = new Transaction( batch );
    var MockClient = function(){};
    t.throws(function(){
      transaction.commit( new MockClient(), 'a string' );
    });
    t.end();
  });
  test('commit - reach max_retries', function(t) {
    var batch = new Batch();
    batch.retries = Infinity;
    var transaction = new Transaction( batch );
    transaction.commit( {}, function( err ){
      t.equal( err, 'reached max retries' );
      t.end();
    });
  });
  test('commit - invalid payload length', function(t) {
    var batch = new Batch();
    batch._operations = [];
    var transaction = new Transaction( batch );
    transaction.commit( {}, function( err, b ){
      t.equal( err, null );
      t.equal( b, batch );
      t.end();
    });
  });
  test('commit - calls Transaction.payload and client.bulk()', function(t) {
    
    var operation1 = new Operation( 'action', 'source' );
    var operation2 = new Operation( 'action', 'source' );
    operation2.setStatus(0); // should be discarded by Transaction.payload()
    
    var batch = new Batch();
    batch.push( operation1 );
    batch.push( operation2 );
    
    var transaction = new Transaction( batch );
    transaction.commit({ bulk: function( command, cb ){
      t.equal( 'object', typeof command );
      t.equal( 'function', typeof cb );
      t.deepEqual( command, { body: [ 'action', 'source' ] } );
      t.end();
    }}, function( err ){
      throw new Error( 'unexpected error event' );
    });
  });
  test('commit - transaction completed successfully', function(t) {
    var batch = new Batch();
    var operation1 = new Operation( 'action', 'source' );
    batch.push( operation1 );
    var transaction = new Transaction( batch );
    var response = { items: [{ create: { status: 201 }}] };
    transaction.commit({ bulk: function( command, cb ){
      cb( null, response );
    }}, function( err, b ){
      t.equal( err, null );
      t.equal( b, batch );
      t.end();
    });
  });
};

module.exports.tests.client_bulk_callback = function(test, common) {
  test('client.bulk - error', function(t) {
    
    var operation1 = new Operation( 'action', 'source' );   
    var batch = new Batch();
    batch.push( operation1 );
    
    var transaction = new Transaction( batch, { max_retries: 0 } );
    transaction.commit({ bulk: function( command, cb ){
      cb( 'client error' );
    }}, function( err ){
      t.equal( err, 'reached max retries' );
      t.equal( batch._status, status.ERROR );
      t.equal( batch.retries, 1 );
      t.end();
    });
  });
  test('client.bulk - invalid resp', function(t) {
    
    var operation1 = new Operation( 'action', 'source' );   
    var batch = new Batch();
    batch.push( operation1 );
    
    var transaction = new Transaction( batch, { max_retries: 0 } );
    transaction.commit({ bulk: function( command, cb ){
      cb( null, null );
    }}, function( err ){
      t.equal( err, 'reached max retries' );
      t.equal( batch._status, status.ERROR );
      t.equal( batch.retries, 1 );
      t.end();
    });
  });
  test('client.bulk - invalid resp.items', function(t) {
    
    var operation1 = new Operation( 'action', 'source' );   
    var batch = new Batch();
    batch.push( operation1 );
    
    var transaction = new Transaction( batch, { max_retries: 0 } );
    transaction.commit({ bulk: function( command, cb ){
      cb( null, { items: {} } );
    }}, function( err ){
      t.equal( err, 'reached max retries' );
      t.equal( batch._status, status.ERROR );
      t.equal( batch.retries, 1 );
      t.end();
    });
  });
  test('client.bulk - retry failed batches', function(t) {
    
    var operation1 = new Operation( 'action', 'source' );   
    var batch = new Batch();
    batch.push( operation1 );
    
    var transaction = new Transaction( batch, { max_retries: 5 } );
    transaction.commit({ bulk: function( command, cb ){
      cb( null, null );
    }}, function( err ){
      t.equal( err, 'reached max retries' );
      t.equal( batch._status, status.ERROR );
      t.equal( batch.retries, 6 );
      t.end();
    });
  });
};

module.exports.tests.updateBatch = function(test, common) {
  test('Transaction.updateBatch - iterate operations', function(t) {
    
    var operation1 = new Operation( 'foo', 'bar' );
    var operation2 = new Operation( 'bing', 'bang' );

    var batch = new Batch();
    batch.push( operation1 );
    batch.push( operation2 );
    
    var clientResponse = [
      {
        create: {
          status: 1001,
          error: 'error1'
        }
      },{
        index: {
          status: 1002,
          error: 'error2'
        }
      }
    ];

    Transaction.updateBatch( batch, clientResponse );
    t.equal( operation1._status, 1001 );
    t.equal( operation2._status, 1002 );
    t.equal( batch._status, 1002 );
    t.end();
  });
};

module.exports.all = function (tape, common) {

  function test(name, testFunction) {
    return tape('Transaction: ' + name, testFunction);
  }

  for( var testCase in module.exports.tests ){
    module.exports.tests[testCase](test, common);
  }
};