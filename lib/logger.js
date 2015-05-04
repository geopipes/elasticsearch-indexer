
var logger = {};
logger.engine = console;

['log','warn','error'].forEach( function( method ){
  logger[method] = function(){
    return logger.engine[method].apply( logger.engine, arguments );
  };
});

module.exports = logger;