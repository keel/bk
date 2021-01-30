const fs = require('fs');
const ktool = require('ktool');
const progress = require('progress-stream');
const ProgressBar = require('./progress-bar');

const url = require('url');
const http = require('http');
const https = require('https');

let myCookie = '_uuid=D408C41E-17CC-C84F-4A51-6D43E2D7DDFD72708infoc; blackside_state=1; CURRENT_FNVAL=80; c=SMZXvCyP-1601869558236-a6e7b86f6f37a-253207689; _fmdata=IPmLNCxgXcD%2BqF0M%2FuedrzjFPrpZ32ADz%2BeKhbryx5DqO5KYnv%2FqsoLa8tnjMq7tDFqMTCOYtTBldGBIIat%2BrW7d2pAX4Nxe%2BqgCHFDMWsI%3D; _xid=6vBAE42KgD8ZUY4ptHD7kfrv4IFUxMCBc6VOAcrDJ1BlgGHvjTrYeQ7TK5%2BAdfHijJner3uHKJzm9F5d3Ua5kA%3D%3D; DedeUserID=39048600; DedeUserID__ckMd5=aed3d1d56ce1f588; SESSDATA=c4172d81%2C1617840485%2Cd953f*a1; bili_jct=454a230dab808e6191921192cd4399bc; CURRENT_QUALITY=116; PVID=1; buivd_fp=24B04184-4D75-4CAA-B7CA-BD2D48B82BDA155645infoc; buvid_fp_plain=24B04184-4D75-4CAA-B7CA-BD2D48B82BDA155645infoc; fingerprint3=62915d7150c58dbec64ac5ed94419571; buvid_fp=24B04184-4D75-4CAA-B7CA-BD2D48B82BDA155645infoc; bp_video_offset_39048600=484452902040271859; bp_t_offset_39048600=484454405279882966; fingerprint=3a5a82789a1e38324bf902a8d91eb1e5; fingerprint_s=65eb3233d245336090d5c36d58e25900; bsource=pc_sem_baidu_dm; sid=b8zr2akm';

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.13; rv:56.0) Gecko/20100101 Firefox/56.0';
const apiUrlA = 'https://api.bilibili.com/x/web-interface/view?';
const apiUrlB = 'https://api.bilibili.com/x/player/playurl?';


const getVideoInfo = async function(aid) {
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
    const writeStream = fs.createWriteStream('./video/' + filename);
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