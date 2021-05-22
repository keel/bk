'use strict';

const readline = require('readline');
const ktool = require('ktool');
const stdin = process.stdin;
const stdout = process.stdout;

const cancelTxt = '取消';

const setRawOn = function() {
  readline.emitKeypressEvents(stdin);
  if (stdin.isTTY) {
    stdin.setRawMode(true);
  }
};

const setRawOff = function() {
  if (stdin.isTTY) {
    stdin.setRawMode(false);
  }
};

const resetIn = function(events) {
  setRawOff();
  if (events) {
    for (const i in events) {
      stdin.removeListener(i, events[i]);
    }
  }
  stdin.resume();
};

const getOptStr = function(optLen) {
  if (optLen > 3) {
    return ' [1, 2...' + optLen + ' / 0]:';
  }
  let out = ' [';
  for (let i = 1; i <= optLen; i++) {
    out += i + ', ';
  }
  out += '0]:';
  return out;
};

const keySelect = function(items, tips, callback) {
  setRawOn();
  if (typeof tips === 'function') {
    callback = tips;
    tips = '请选择';
  }
  let options = '';
  const optMap = { '0': '0' };
  if (items.constructor.name !== 'Array') {
    items = [items];
  }
  for (let i = 0, len = items.length; i < len; i++) {
    const index = '' + (i + 1);
    options += '[' + index + '] ' + items[i] + '\n';
    optMap[index] = '1';
  }
  options += '[0] ' + cancelTxt + '\n';
  stdout.write(options + '\n' + tips + getOptStr(items.length));
  stdin.resume();
  stdin.setEncoding('utf8');
  const pressEvent = (chunk, key) => {
    // console.log('keypress:' , key);
    if (key && key.ctrl && key.name == 'c') {
      // console.log('exit...');
      process.exit();
      return;
    }
    const selected = optMap[chunk];
    if (!selected) {
      stdout.write('');
    } else {
      stdout.write(chunk + '\n');
      resetIn({ 'keypress': pressEvent });
      callback(null, parseInt(chunk));
    }
  };
  stdin.on('keypress', pressEvent);

};


const question = function(query, callback) {
  stdout.write(query);
  stdin.resume();
  stdin.setEncoding('utf8');
  stdin.on('data', (data) => {
    callback(null, data);
  });
};



const keySelectSync = ktool.promi(keySelect);
const questionSync = ktool.promi(question);

exports.keySelect = keySelect;
exports.keySelectSync = keySelectSync;
exports.question = question;
exports.questionSync = questionSync;



// (async function() {

//   console.log('start....');
//   const a = await keySelectSync(['使用空cookie', '我已录入新cookie'], '请选择一个');

//   console.log('已选择:' + a);

//   const b = await questionSync('再来?');
//   console.log('又再' + b);

//   const c = await keySelectSync(['aaaaaa', 'bbbbb', '录入新', 'ddddd', 'eeeeee']);

//   console.log('又已选择:' + c);

//   const d = await questionSync('再来?');
//   console.log('最后再' + d);


//   const e = await keySelectSync(['录入新', 'bbbbb', '录入新', 'bbbbb', 'ccccc', 'ddddd', '录入新s']);

//   console.log('又...已选择:' + e);

// })().catch((err) => {
//   console.error(err);
// });