
var Batch = require('./Batch'),
    status = require('./status'),
    logger = require('./logger'),
    check = require('check-types');

function Transaction( batch, opts ){
  
  if( !check.object( batch ) ){
    throw new Error( 'invalid Batch' );
  }
  this.batch = batch;

  this.opts = check.object( opts ) ? opts : {};
  if( !check.number( this.opts.max_retries ) ){
    this.opts.max_retries = 5;
  }
}

Transaction.prototype.commit = function( client, cb ){

  // Validate args
  if( !check.object( client ) ){ throw new Error( 'invalid client' ); }
  if( !check.function( cb ) ){ throw new Error( 'invalid callback' ); }

  // Too many retries, abort commit
  if( this.batch.retries > this.opts.max_retries ){
    return cb( 'reached max retries' );
  }

  var payload = Transaction.payload( this.batch );

  // Payload empty, nothing to do, abort commit
  if( !payload.length ){
    // transaction complete
    return cb( null, this.batch );
  }

  client.bulk( { body: payload }, function( err, resp ){

    // logger.log( err, resp );

    // Client error or...
    // Unexpected/Invalid response object from es bulk index operation
    if( err || !check.object( resp ) || !check.array( resp.items ) ){
      this.batch.setStatus( status.ERROR );
    } else {
      Transaction.updateBatch( this.batch, resp.items );
    }

    // retry batch
    if( this.batch._status > status.CREATED ){
      logger.log( 'retrying batch', '[' + this.batch._status + ']' );
      this.batch.retries++;
      return this.commit( client, cb );
    }

    // transaction complete
    return cb( null, this.batch );

  }.bind(this));
};

// Build the payload which will be sent to elasticsearch
Transaction.payload = function( batch ){
  var payload = [];

  // Add incomplete operations to payload
  batch._operations.forEach( function( operation ){
    if( operation.getStatus() > 201 ){
      payload.push( operation.action );

      // delete operations do not have a source
      if( operation.source ){
        payload.push( operation.source );
      }
    }
  });

  return payload;
};

// Update batch items with response status
Transaction.updateBatch = function( batch, items ){
  // logger.log( resp.items.length, batch._operations.length, payload.length );
  items.forEach( function( item, i ){

    // logger.log( item );

    var res;
    if( item.hasOwnProperty('create') ){ res = item.create; }
    else if( item.hasOwnProperty('index') ){ res = item.index; }
    else if( item.hasOwnProperty('delete') ){ res = item.delete; }
    else if( item.hasOwnProperty('update') ){ res = item.update; }
    // @todo: is it possible to have none of these props?
    // @whattodo?

    var operation = batch._operations[i];
    operation.setStatus( parseInt( res.status, 10 ) || status.UNKNOWN );
    // logger.log( 'set operation status', operation.status, JSON.stringify( res, null, 2 ) );

    if( operation._status > status.CREATED ){
      logger.log( '[' + res.status + ']', res.error );
    }
    // else {
    //   delete operation.cmd; // reclaim memory
    //   delete operation.data; // reclaim memory
    // }

    // set batch status to highest response code
    if( batch._status === status.DEFAULT || operation._status > batch._status ){
      batch._status = operation._status;
    }
  });
};

module.exports = Transaction;