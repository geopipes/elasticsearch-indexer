
var status = require('./status');

// https://www.elastic.co/guide/en/elasticsearch/reference/current/docs-bulk.html

// Create a new Operation
function Operation( action, source ){
  this.action = action;
  this.source = source;
  this.setStatus( status.DEFAULT );
}

//todo: validate action, source

Operation.prototype.setStatus = function( status ){
  var s = parseInt( status, 10 );
  if( isNaN( s ) ){
    throw new Error( 'invalid batch status' );
  }
  this._status = s;
};

Operation.prototype.getStatus = function(){
  return this._status;
};

module.exports = Operation;