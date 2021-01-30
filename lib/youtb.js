const fs = require('fs');
const youtubedl = require('youtube-dl');
const ktool = require('ktool');
const readlineSync = require('readline-sync');

const downloadYoutube = function(videoUrl, newFileName) {
  const video = youtubedl(videoUrl,
    // Optional arguments passed to youtube-dl.
    ['--format=18'],
    // Additional options can be given for calling `child_process.execFile()`.
    { cwd: __dirname });

  // Will be called when the download starts.
  video.on('info', function(info) {
    console.log('Download started');
    console.log('filename: ' + info._filename);
    console.log('size: ' + info.size);
  });

  video.pipe(fs.createWriteStream(newFileName));
  console.log('out ====>[%s]', newFileName);
};

const main = function() {
  const url = readlineSync.question('请输入youtube的url:');
  downloadYoutube(url, ktool.randomStr(6) + '.mp4');
};

exports.main = main;

// downloadYoutube('https://www.youtube.com/watch?v=3l0k2xkcT3g','eve.mp4');