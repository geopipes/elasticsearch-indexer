
var util = require('util'),
    status = require('../../lib/status'),
    Operation = require('../../lib/Operation');

module.exports.tests = {};

module.exports.tests.interface = function(test, common) {
  test('class interface', function(t) {
    t.equal(typeof Operation, 'function', 'valid class');
    t.equal(typeof Operation.prototype, 'object', 'valid proto');
    t.end();
  });
  test('prototype methods', function(t) {
    t.equal(typeof Operation.prototype.setStatus, 'function', 'valid method');
    t.equal(typeof Operation.prototype.getStatus, 'function', 'valid method');
    t.end();
  });
};

module.exports.tests.constructor = function(test, common) {
  test('constructor', function(t) {

    var MockOperation = function(){
      Operation.call(this);
    };
    util.inherits( MockOperation, Operation );

    MockOperation.prototype.setStatus = function( param ){
      t.equal(param, status.DEFAULT, 'setStatus called in contructor');
    };

    t.plan(1);
    var o = new MockOperation('a','b');
  });
};

module.exports.tests.todo = function(test, common) {
  test('todo', function(t) {
    var o = new Operation('a','b');
    t.equal(o.action, 'a', 'set action');
    t.equal(o.source, 'b', 'set source');
    t.end();
  });
};

module.exports.tests.setStatus = function(test, common) {
  test('setStatus: valid', function(t) {
    var b = new Operation('a','b');
    b.setStatus(10);
    t.equal(b._status, 10, 'set batch status');
    b.setStatus('11');
    t.equal(b._status, 11, 'set batch status');
    t.end();
  });
  test('setStatus: invalid', function(t) {
    var b = new Operation('a','b');
    b.setStatus(99);
    t.throws( function(){ b.setStatus(null); });
    t.throws( function(){ b.setStatus('foo'); });
    t.throws( function(){ b.setStatus(undefined); });
    t.equal(b._status, 99, 'batch status unchanged');
    t.end();
  });
};

module.exports.tests.getStatus = function(test, common) {
  test('getStatus', function(t) {
    var b = new Operation('a','b');
    b.getStatus();
    t.equal(b.getStatus(), status.DEFAULT, 'get batch status');
    b.setStatus('11');
    t.equal(b.getStatus(), 11, 'get batch status');
    t.end();
  });
};

module.exports.all = function (tape, common) {

  function test(name, testFunction) {
    return tape('Operation: ' + name, testFunction);
  }

  for( var testCase in module.exports.tests ){
    module.exports.tests[testCase](test, common);
  }
};