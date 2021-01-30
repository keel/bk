'use strict';
const fluent_ffmpeg = require('fluent-ffmpeg');
const progressBar = require('./progress-bar');
const Path = require('path');
let mergedVideo = fluent_ffmpeg();
const pb = new progressBar('转码&合成进度', 50);

function mergeVideos(name, format, allTime, len, outFormat, callback) {
  const videoNames = getVideoNames(name, format, len, outFormat);
  // console.log('videoNames:%j',videoNames);
  videoNames.videoArr.forEach(function(videoName) {
    mergedVideo = mergedVideo.addInput(videoName);
  });
  console.log('转码格式:', outFormat || 'mp4');
  if (outFormat) {
    mergedVideo.format(outFormat);
  }
  mergedVideo.mergeToFile(videoNames.videoAll, '../tmp/')
    .on('error', function(err) {
      console.log('Error ' + err.message);
      if (callback) {
        return callback(err);
      }
    })
    .on('progress', function(progress) {
      const timeMark = timeToMs(progress.timemark);
      pb.render({
        completed: timeMark ? timeMark : 0,
        total: allTime
      });
    })
    .on('end', function() {
      pb.render({
        completed: allTime,
        total: allTime
      });
      console.log('\nFinished!');
      if (callback) {
        callback();
      }
    });
}

function getVideoNames(name, format, len, outFormat) {
  // const newName = getVideoName(name),
  const baseName = Path.basename(name);
  const newName = baseName.substring(0, baseName.lastIndexOf('-') + 1),
    videoArr = [];
  for (let index = 0; index < len; index++) {
    videoArr.push('./video/' + newName + index + '.' + format);
  }
  return {
    videoArr,
    videoAll: './video/' + newName + 'all.' + (outFormat || 'mp4')
  };
}

function timeToMs(str) {
  const arr1 = str.split(':');
  const arr2 = arr1.map((item, index) => {
    return parseFloat(item);
  });
  return arr2[0] * 60 * 60 * 1000 + arr2[1] * 60 * 1000 + arr2[2] * 1000;
}

exports.mergeVideos = mergeVideos;

//