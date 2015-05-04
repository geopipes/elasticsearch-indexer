
var logger = require('./logger');

function Concurrency( min, max ){

  var _min = parseInt( min, 10 );
  var _max = parseInt( max, 10 );
  
  this.min = !isNaN( _min ) ? _min : 8;
  this.max = !isNaN( _max ) ? _max : 50;

  this._resumeFunc = undefined;
  this.paused = false;
  this.active = 0;
}

Concurrency.prototype.defer = function( next ){
  if( this.active >= this.min ){
    
    if( this.paused ){
      logger.warn( 'WARNING: double pause' );
    }

    this.paused = true;
    this._resumeFunc = next;
  }
  else {
    // not paused, execute immediately
    next();
  }
};

Concurrency.prototype.resume = function(){
  if( this.paused && this.active <= this.max ){
    var unpause = this._resumeFunc;
    this.paused = false;
    this._resumeFunc = undefined;
    unpause();
  }
};

module.exports = Concurrency;