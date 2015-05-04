#!/usr/bin/env node

var program = require('commander');
var stdinIndexerStream = require('./stdinIndexerStream');

program
  .version( require('../package').version )
  .option('-i, --insert', 'Create stdin insert stream')
  .parse(process.argv);

if (program.insert){
  var stream = stdinIndexerStream();
  process.stdin.pipe( stream );
}