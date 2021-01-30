const ktool = require('ktool');
const progress = require('progress-stream');
const ProgressBar = require('./progress-bar');
const outVideo = require('./outVideo');

const url = require('url');
const http = require('http');
const https = require('https');

let myCookie = '';

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.13; rv:56.0) Gecko/20100101 Firefox/56.0';
const apiUrlA = 'https://api.bilibili.com/x/web-interface/view?';
const apiUrlB = 'https://api.bilibili.com/x/player/playurl?';


const getVideoInfo = async function(aid) {
  console.log('myCookie',myCookie);
  const infoStr = '' + await ktool.promi(ktool.httpGet)(apiUrlA + 'aid=' + aid, {
    'headers': {
      'User-Agent': UA,
      'Cookie': myCookie
    }
  });
  const info = JSON.parse(infoStr);
  if (info.data) {
    return info.data;
  }
  console.error('无video数据:%j',info);
  return null;
};


const getDownloadInfo = async function(aid, cid, qualityNum) {
  console.log('myCookie',myCookie);
  const infoStr = '' + await ktool.promi(ktool.httpGet)(apiUrlB + `avid=${aid}&cid=${cid}&qn=${qualityNum}&otype=json`, {
    'headers': {
      'User-Agent': UA,
      'Cookie': myCookie
    }
  });
  const info = JSON.parse(infoStr);
  if (info.data) {
    return info.data;
  }
  console.error('无download数据:%j',info);
  return null;
};


const httpGet = function(uri, aid, filename, str, writeStream, reject) {
  // console.log('uri:---->', uri);
  const opts2 = url.parse(uri);
  opts2.headers = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.13; rv:56.0) Gecko/20100101 Firefox/56.0',
    'Accept': '*/*',
    'Accept-Language': 'en-US,en;q=0.5',
    'Accept-Encoding': 'gzip, deflate, br',
    'Range': 'bytes=0-',
    // 'Content-Type': 'application/octet-stream',
    'Referer': 'https://www.bilibili.com/video/av' + aid + '/',
    'Origin': 'https://www.bilibili.com',
    'Connection': 'keep-alive'
  };
  const httpWraper = (uri.startsWith('https')) ? https : http;
  httpWraper.get(opts2, function(res2) {
    if (res2.statusCode === 302) {
      // console.log('headers:%j', res2.headers);
      const u2 = res2.headers.location;
      console.log('302:---->get again');
      res2.destroy();
      httpGet(u2, aid, filename, str, writeStream);
      return;
    }
    if (res2.statusCode !== 200 && res2.statusCode !== 206) { //206是正常状态
      console.error('http get statusCode is ' + res2.statusCode);
      console.log('headers:%j', res2.headers);
      res2.destroy();
      reject(new Error('statusCode'));
      return;
    }
    // console.log('======> will pipe, statusCode:', res2.statusCode);
    res2.pipe(str).pipe(writeStream);
    // res2.on('data', function(chunk) {
    //   bodyBuf = Buffer.concat([bodyBuf, chunk]);
    // });
    res2.on('end', function() {
      console.log('\n' + filename + '下载完成');
    });
  }).on('error', function(e) {
    if (e.code !== 'HPE_INVALID_CONSTANT') { //此异常可忽略
      console.error('onEEEEE', e);
      reject(e);
    }
  });
};

function downloadFile(aid, totalSize, totalTime, uri, filename) {
  return new Promise(function(resolve, reject) {
    // console.log('downloadFile: uri:'+uri+',filename:'+filename,aid,totalSize,totalTime);
    const pb = new ProgressBar('下载进度', 50);
    const str = progress({
      time: 1000
    });
    str.on('progress', function(progress) {
      pb.render({
        completed: progress.transferred ? progress.transferred : 0,
        total: totalSize
      });
    });

    const writeStream = outVideo.createOutWriteStream(filename);
    httpGet(uri, aid, filename, str, writeStream, reject);
    writeStream.on('finish', function(err) {
      if (err) {
        return reject(err);
      }
      writeStream.end();
      resolve({
        name: filename,
        time: totalTime
      });
    });
  });
}

const setCookie = function(newCookie) {
  myCookie = newCookie;
};

exports.getVideoInfo = getVideoInfo;
exports.getDownloadInfo = getDownloadInfo;
exports.downloadFile = downloadFile;
exports.setCookie = setCookie;


//