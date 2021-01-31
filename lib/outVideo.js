'use strict';
const fluent_ffmpeg = require('fluent-ffmpeg');
const progressBar = require('./progress-bar');
const Path = require('path');
const Fs = require('fs');

const pwdDir = process.cwd();
let saveDirPath = pwdDir;

const setSaveDirPath = function(newPath) {
  saveDirPath = newPath;
};

function mergeVideos(name, format, len, outFormat, callback) {
  let mergedVideo = fluent_ffmpeg();
  const pb = new progressBar('转码&合成进度', 50);
  const videoNames = getVideoNames(name, format, len, outFormat);
  console.log('videoNames:%j', videoNames);
  videoNames.videoArr.forEach(function(videoName) {
    mergedVideo = mergedVideo.addInput(videoName);
  });
  console.log('转码格式:', outFormat || 'mp4');
  if (outFormat) {
    mergedVideo.format(outFormat);
  }
  mergedVideo
    .on('error', function(err) {
      console.log('Error ' + err.message);
      if (callback) {
        return callback(err);
      }
    })
    .on('progress', function(progress) {
      pb.render({
        completed: Math.floor(progress.percent),
        total: 100
      });
    })
    .on('end', function() {
      pb.render({
        completed: 100,
        total: 100
      });
      console.log('\nOK! ==>', videoNames.videoAll, '\n\n');
      if (callback) {
        callback();
      }
    }).mergeToFile(videoNames.videoAll, '../tmp/');
}

function getVideoNames(name, format, len, outFormat) {
  const baseName = Path.basename(name);


  const newName = baseName.substring(0, baseName.lastIndexOf('-') + 1),
    videoArr = [];
  for (let index = 0; index < len; index++) {
    videoArr.push(Path.join(saveDirPath, newName + index + '.' + format));
  }
  return {
    videoArr,
    videoAll: Path.join(saveDirPath, newName + 'all.' + (outFormat || 'mp4'))
  };
}

const createOutWriteStream = function(filename) {
  if (!Fs.existsSync(saveDirPath)) {
    Fs.mkdirSync(saveDirPath);
    console.log('创建输出目录:', saveDirPath);
  }
  return Fs.createWriteStream(Path.join(saveDirPath, filename));
};

exports.setSaveDirPath = setSaveDirPath;
exports.mergeVideos = mergeVideos;
exports.createOutWriteStream = createOutWriteStream;

//