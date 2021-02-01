#! /usr/bin/env node

'use strict';
const bili = require('./lib/bili');
const packJson = require('./package.json');
console.log('bk ver:', packJson.version);
// const args = process.argv;
// if (args.length > 2 && args[2].toLowerCase().charAt(0) === 'y') {
//   const youtb = require('./lib/youtb');
//   youtb.main();
// } else {
// }
bili.main();