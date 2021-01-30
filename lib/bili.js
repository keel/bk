'use strict';
const biliTool = require('./biliTool');
const outVideo = require('./outVideo');
const readlineSync = require('readline-sync');
const Path = require('path');
const Fs = require('fs');


const bv2av = function(bvOrAv, is2Bv) {
  const table = 'fZodR9XQDSUm21yCkr6zBqiveYah8bt4xsWpHnJE7jL5VG3guMTKNPAwcF',
    tr = {};
  for (let i = 0; i < 58; i++) {
    tr[table[i]] = i;
  }
  const s = [11, 10, 3, 8, 4, 6],
    xor = 177451812,
    add = 8728348608;

  function dec(x) {
    let r = 0;
    for (let i = 0; i < 6; i++) {
      r += tr[x[s[i]]] * 58 ** i;
    }
    return (r - add) ^ xor;
  }

  function enc(x) {
    let r = 0;
    x = (x ^ xor) + add;
    r = 'BV1  4 1 7  '.split('');
    for (let i = 0; i < 6; i++) {
      r[s[i]] = table[Math.floor(x / 58 ** i) % 58];
    }
    return r.join('');
  }
  if (is2Bv) {
    return enc(parseInt(bvOrAv));
  }
  return dec(bvOrAv);

  // console.log(dec('BV1mQ4y1M7p9'));
  // console.log(enc(710127539));
};


// 质量值对应
// '高清1080P60(大会员)': 116,
// '高清1080P+(大会员)': 112,
// '高清1080P': 80,
// '高清720P60(大会员)': 74,
// '高清720P': 64,
// '清晰480P': 32,
// '流畅360P': 16,

const downloadOne = async function(aid, cid, title, pNum, quality, outFormat, isNeedQulityCheck) {
  let oneQality = -1;
  if (isNeedQulityCheck) {
    const dInfo = await biliTool.getDownloadInfo(aid, cid, 16);
    for (let i = 0, len = dInfo.accept_quality.length; i < len; i++) {
      if (dInfo.accept_quality[i] === quality) {
        oneQality = quality;
        break;
      }
    }
    if (oneQality === -1) {
      oneQality = dInfo.accept_quality[0]; //如果没有指定的质量,默认使用最佳质量
    }
  } else {
    oneQality = quality;
  }
  // console.log('oneQality:', oneQality);
  const downloadInfo = await biliTool.getDownloadInfo(aid, cid, oneQality);
  let time = 0;
  const dUrlArr = downloadInfo.durl;
  for (let i = 0, len = dUrlArr.length; i < len; i++) {
    const item = dUrlArr[i];
    let extName = null;
    const paraIndex = item.url.indexOf('?');
    if (paraIndex > 1) {
      extName = Path.extname(item.url.substring(0, paraIndex));
    } else {
      extName = Path.extname(item.url);
    }
    const downloadResult = await biliTool.downloadFile(aid, item.size, item.length, item.url, `[p${pNum}]${title}-${i}` + extName);
    const filePath = Path.parse(downloadResult.name);
    time += downloadResult.time;
    // 合并&转码视频
    if (outFormat === '不合并转码') {
      console.log('跳过执行合并&转码');
      return;
    }
    await new Promise(function(resolve, reject) {
      outVideo.mergeVideos(filePath.name, filePath.ext.substring(1), time, len, outFormat, function(err) {
        if (err) {
          return reject(err);
        }
        resolve();
      });
    });
  }
};

async function main() {
  const newCookie = readlineSync.question('请输入BiliBili新cookie(包含"_uuid="),直接回车使用空cookie:');
  if (newCookie.length > 10) {
    biliTool.setCookie(newCookie);
  } else {
    const configJson = Path.join(__dirname, '../config/cookie.json');
    if (Fs.existsSync(configJson)) {
      const cCookie = require(configJson);
      biliTool.setCookie(cCookie.cookie);
      console.log('使用默认cookie.');
    } else {
      console.log('使用空cookie!');
    }
  }
  let pNum = 0;
  let aid = readlineSync.question('请输入BiliBili的av/BV号(或url):');
  if (aid.indexOf('av') >= 0) {
    aid = aid.substring(aid.lastIndexOf('av') + 2);
  } else if (aid.indexOf('BV') >= 0) {
    aid = aid.substring(aid.lastIndexOf('BV'));
    aid = bv2av(aid);
    // 下面是通过api转换
    // const vInfo = await rp(`https://api.bilibili.com/x/web-interface/view?bvid=${aid}`);
    // aid = JSON.parse(vInfo).data.aid;
  }
  console.log('aid:[%s]', aid);
  if (aid.length <= 0) {
    console.log('错误:aid为空');
    return;
  }
  // 检查是否是多P
  const videoInfo = await biliTool.getVideoInfo(aid);
  if (videoInfo.pages && videoInfo.pages.length > 1) {
    const pageArr = [];
    const pageCount = videoInfo.pages.length;
    for (let i = 0; i < pageCount; i++) {
      const pageOne = videoInfo.pages[i];
      pageArr.push(pageOne.part);
    }
    pageArr.push('===>下载所有分P');
    const pNumStr = readlineSync.keyInSelect(pageArr, '请选择分P号:');
    pNum = parseInt(pNumStr);
    if (pNum < 0) {
      console.log('退出');
      return;
    }
    if (pNum >= pageArr.length - 1) {
      pNum = -999; //最后一个选项,表示下载所有
    }
    // console.log('pNum:', pNum);
  } else {
    console.log('单P -> ' + videoInfo.title);
  }

  const downloadInfo = await biliTool.getDownloadInfo(aid, videoInfo.cid, 16);
  const qualityDesArr = downloadInfo.accept_description;
  const qualityArr = downloadInfo.accept_quality;
  const qualityIndex = parseInt(readlineSync.keyInSelect(qualityDesArr, '选择要下载到清晰度？'));
  if (qualityIndex < 0) {
    console.log('退出');
    return;
  }
  const quality = qualityArr[qualityIndex];
  // console.log('quality', quality);


  const outFormatArr = ['mp4', 'mp3', '不合并转码'];
  const outFormatIndex = parseInt(readlineSync.keyInSelect(outFormatArr, '选择转码&合并的输出格式？'));
  if (outFormatIndex < 0) {
    console.log('退出');
    return;
  }
  const outFormat = outFormatArr[outFormatIndex];
  // console.log('outFormat:', outFormat);

  try {
    if (pNum !== -999) {
      const vOne = videoInfo.pages[pNum];
      await downloadOne(aid, vOne.cid, vOne.part || videoInfo.title, pNum + 1, quality, outFormat);
    } else {
      for (let i = 0, len = videoInfo.pages.length; i < len; i++) {
        const vOne = videoInfo.pages[i];
        await downloadOne(aid, vOne.cid, vOne.part, vOne.page, quality, outFormat, true);
      }
    }
  } catch (err) {
    console.error(err);
  }


}

exports.setCookie = biliTool.setCookie;
exports.main = main;


//