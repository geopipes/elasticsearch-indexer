
var logger = { engine: console };

['log','info','error','warn','dir','time','timeEnd','trace','assert']
  .forEach( function( method ){
    logger[method] = function(){
      return logger.engine[method].apply( logger.engine, arguments );
    };
  });

module.exports = logger;