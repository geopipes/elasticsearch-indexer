
var indexer = require('../index'),
    split = require('split'),
    through = require('through2'),
    logger = require('../lib/logger'),
    elasticsearch = require('elasticsearch');

module.exports = function createStream( opts ){

  var options = applyDefaults( opts );

  var client = new elasticsearch.Client({
    host: options.host,
    keepAlive: true
  });

  var manager = new indexer.TransactionManager( client );
  var stream = split();
  
  stream
    .pipe( jsonParser() )
    .pipe( operationMapStream( options ) )
    .pipe( manager.operationWriteStream() );

  return stream;
};

function jsonParser(){
  return through.obj( function( chunk, enc, next ){
    try {
      var o = JSON.parse( chunk.toString('utf8') );
      if( o ){ this.push( o ); }
    }
    catch( e ){
      logger.error( 'stream end' );
    }
    finally {
      next();
    }
  });
}

function operationMapStream( options ){
  return through.obj( function( chunk, enc, next ){
    this.push( new indexer.Operation({ index : {
      _index : chunk[options.indexProp],
      _type : chunk[options.typeProp],
      _id : chunk[options.idProp]
    }}, chunk[options.dataProp] ));
    next();
  });
}

function applyDefaults( opts ){
  var options = {};
  options.host = opts && opts.hasOwnProperty('host') ? opts.host : 'localhost:9200';
  options.indexProp = opts && opts.hasOwnProperty('indexProp') ? opts.indexProp : '_index';
  options.typeProp  = opts && opts.hasOwnProperty('typeProp')  ? opts.typeProp  : '_type';
  options.idProp    = opts && opts.hasOwnProperty('idProp')    ? opts.idProp    : '_id';
  options.dataProp  = opts && opts.hasOwnProperty('dataProp')  ? opts.dataProp  : 'data';
  return options;
}