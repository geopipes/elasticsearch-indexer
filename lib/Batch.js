
var util = require('util'),
    status = require('./status'),
    EventEmitter = require('events').EventEmitter;

// Create a new Batch
function Batch( opts ){
  EventEmitter.call( this );
  this.retries = 0;
  this.setSize( opts && opts.size || 500 );
  this.reset();
}

util.inherits( Batch, EventEmitter );

// Set the maximum batch size
Batch.prototype.setSize = function( size ){
  var s = parseInt( size, 10 );
  if( isNaN( s ) ){
    throw new Error( 'invalid batch size' );
  }
  this._size = s;
};

Batch.prototype.setStatus = function( status ){
  var s = parseInt( status, 10 );
  if( isNaN( s ) ){
    throw new Error( 'invalid batch status' );
  }
  this._status = s;
};

// Reset batch to an empty inital state
Batch.prototype.reset = function(){
  this._operations = [];
  this._retries = 0;
  this.setStatus( status.DEFAULT );
};

// How many free slots are left in this batch
Batch.prototype.free = function(){
  return this._size - this._operations.length;
};

// Add an operation to the batch
Batch.prototype.push = function( operation ){
  
  // return false if batch is full
  if( !this.free() ){
    return false;
  }

  // push operation in to batch queue
  this._operations.push( operation );

  // emit flush when batch is full
  if( !this.free() ){
    this.emit('flush', this);
  }

  return true;
};

module.exports = Batch;