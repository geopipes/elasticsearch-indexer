
var through = require('through2');

function createStream( client, opts ){

  var stream = through.obj( function( chunk, enc, next ){

  }, function(){

  });

  return stream;
}

module.exports = createStream;