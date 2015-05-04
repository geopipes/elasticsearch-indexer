
var Batch = require('./Batch'),
    through = require('through2'),
    Transaction = require('./Transaction'),
    Concurrency = require('./Concurrency');

// Create a new TransactionManager
function TransactionManager( client, opts, done ){
  this.client = client;
  this.opts = opts || {};
  if( !this.opts.hasOwnProperty('batch') ){
    this.opts.batch = { size: 500 };
  }
  if( !this.opts.hasOwnProperty('transaction') ){
    this.opts.transaction = { max_retries: 5 };
  }
  if( !this.opts.hasOwnProperty('concurrency') ){
    this.opts.concurrency = { min: 8, max: 50 };
  }
  this.done = ( 'function' === typeof done ) ? done : client.close.bind(client);
  this.concurrency = new Concurrency(
    this.opts.concurrency.min,
    this.opts.concurrency.max
  );
  this.reset();
}

// Reset TransactionManager to an empty inital state
TransactionManager.prototype.reset = function(){
  this._finished = false;
  this.flush();
};

// Flush current batch and create new empty batch
TransactionManager.prototype.flush = function(){
  if( this._current ){
    this.commit( this._current );
  }
  this._current = new Batch( this.opts.batch );
  this._current.on( 'flush', this.flush.bind(this) );
};

// Commit batch to DB
TransactionManager.prototype.commit = function( batch ){

  var transaction = new Transaction( batch, this.opts.transaction );
  this.concurrency.active++;
  
  transaction.commit( this.client, function( err ){
    this.concurrency.active--;
    this.concurrency.resume();
    this._attemptEnd();
  }.bind(this));
};

// Add an operation to the batch
TransactionManager.prototype.transform = function( operation, _, next ){
  this._current.push( operation );
  this.concurrency.defer( next );
};

TransactionManager.prototype.operationWriteStream = function(){
  var stream = through.obj(
    this.transform.bind( this ),
    this.end.bind( this )
  );
  return stream;
};

TransactionManager.prototype.end = function(){
  this._finished = true;
  if( this._current._operations.length ){ // @todo: public API
    this.flush();
  } else {
    this._attemptEnd();
  }
};

TransactionManager.prototype._attemptEnd = function(){
  if( this._finished && !this.concurrency.active && !this._current._operations.length ){ // @todo: public API
    // this.client.close(); // @todo: close outside
    if( 'function' === typeof this.done ){
      this.done();
      this.done = null; // prevent done being called more than once.
    }
    // stats.end();
    // hc.end();
  }
};

module.exports = TransactionManager;