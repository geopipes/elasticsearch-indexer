
var util = require('util'),
    Batch = require('../../lib/Batch');

module.exports.tests = {};

module.exports.tests.interface = function(test, common) {
  test('class interface', function(t) {
    t.equal(typeof Batch, 'function', 'valid class');
    t.equal(typeof Batch.prototype, 'object', 'valid proto');
    t.end();
  });
  test('EventEmitter interface', function(t) {
    t.equal(typeof Batch.prototype.on, 'function', 'valid EventEmitter');
    t.equal(typeof Batch.prototype.emit, 'function', 'valid EventEmitter');
    t.end();
  });
  test('prototype methods', function(t) {
    t.equal(typeof Batch.prototype.setSize, 'function', 'valid method');
    t.equal(typeof Batch.prototype.reset, 'function', 'valid method');
    t.equal(typeof Batch.prototype.free, 'function', 'valid method');
    t.equal(typeof Batch.prototype.push, 'function', 'valid method');
    t.end();
  });
};

module.exports.tests.constructor = function(test, common) {
  test('constructor', function(t) {

    var MockBatch = function(){
      Batch.apply(this,arguments);
    };
    util.inherits( MockBatch, Batch );

    MockBatch.prototype.setSize = function( param ){
      t.equal(param, 500, 'setSize called in contructor');
    };
    MockBatch.prototype.reset = function( param ){
      t.equal(param, undefined, 'reset called in contructor');
    };

    t.plan(3);
    var b = new MockBatch();
    t.equal( b.retries, 0, 'default retries count' );
  });
  test('constructor - opts.size', function(t) {

    var MockBatch = function(){
      Batch.apply(this,arguments);
    };
    util.inherits( MockBatch, Batch );

    MockBatch.prototype.setSize = function( param ){
      t.equal(param, 999, 'setSize called in contructor');
      t.end();
    };

    var b = new MockBatch({ size: 999 });
  });
};

module.exports.tests.setSize = function(test, common) {
  test('setSize: valid', function(t) {
    var b = new Batch();
    b.setSize(10);
    t.equal(b._size, 10, 'set batch size');
    b.setSize('11');
    t.equal(b._size, 11, 'set batch size');
    t.end();
  });
  test('setSize: invalid', function(t) {
    var b = new Batch();
    b.setSize(99);
    t.throws( function(){ b.setSize(null); });
    t.throws( function(){ b.setSize('foo'); });
    t.throws( function(){ b.setSize(undefined); });
    t.equal(b._size, 99, 'batch size unchanged');
    t.end();
  });
};

module.exports.tests.setStatus = function(test, common) {
  test('setStatus: valid', function(t) {
    var b = new Batch();
    b.setStatus(10);
    t.equal(b._status, 10, 'set batch status');
    b.setStatus('11');
    t.equal(b._status, 11, 'set batch status');
    t.end();
  });
  test('setStatus: invalid', function(t) {
    var b = new Batch();
    b.setStatus(99);
    t.throws( function(){ b.setStatus(null); });
    t.throws( function(){ b.setStatus('foo'); });
    t.throws( function(){ b.setStatus(undefined); });
    t.equal(b._status, 99, 'batch status unchanged');
    t.end();
  });
};

module.exports.tests.reset = function(test, common) {
  test('reset', function(t) {
    var b = new Batch();
    b._operations = ['a'];
    b._retries = 5;
    b._status = 1;
    b.reset();
    t.true(Array.isArray(b._operations), 'slots array');
    t.equal(b._operations.length, 0, 'truncate slots');
    t.equal(b._retries, 0, 'reset retry counter');
    t.equal(b._status, 999, 'reset status code');
    t.end();
  });
};

module.exports.tests.free = function(test, common) {
  test('free', function(t) {
    var b = new Batch();
    b._size = 5;
    t.equal(b.free(), 5, 'count free slots');
    b._operations.push('a');
    t.equal(b.free(), 4, 'count free slots');
    b._size = 2;
    t.equal(b.free(), 1, 'count free slots');
    t.end();
  });
};

module.exports.tests.push = function(test, common) {
  test('push: full before push', function(t) {
    var b = new Batch();
    b._size = 0;
    t.false(b.push('a'), 'batch full');
    t.equal(b._operations.length, 0, 'no push');
    t.end();
  });
  test('push: success', function(t) {
    var b = new Batch();
    b._size = 2;
    t.true(b.push('a'), 'batch push');
    t.equal(b._operations.length, 1, 'batch push');
    t.equal(b._operations[0], 'a', 'batch push');
    t.end();
  });
  test('push: flush once full', function(t) {
    var b = new Batch();
    b._size = 1;
    b.on('flush', function(arg){
      t.equal(arg, b, 'flush called once');
      t.end();
    });
    b.push('a');
    b.push('a');
  });
};

module.exports.all = function (tape, common) {

  function test(name, testFunction) {
    return tape('Batch: ' + name, testFunction);
  }

  for( var testCase in module.exports.tests ){
    module.exports.tests[testCase](test, common);
  }
};