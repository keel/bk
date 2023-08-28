'use strict';
const biliTool = require('./biliTool');
const ktool = require('ktool');
const outVideo = require('./outVideo');
// const readlineSync = require('readline-sync');
const stdinPlus = ktool.stdinPlus;
const Path = require('path');
const Fs = require('fs');
const pwdDir = process.cwd();

const saveDir = 'video';
const cookieTxt = 'cookie.txt';
const saveDirPath = Path.join(pwdDir, saveDir);
const cookieFilePath = Path.join(pwdDir, cookieTxt);
const noMergeTxt = '不转码(未安装ffmpeg请选择此项)';

const checkCookieFile = async function() {
  if (!Fs.existsSync(saveDirPath)) {
    Fs.mkdirSync(saveDirPath);
    console.log('创建输出目录:', saveDirPath);
  }
  let isSetCookie = 0;
  if (!Fs.existsSync(cookieFilePath)) {
    Fs.writeFileSync(cookieFilePath, '');
    console.log('创建cookie配置文件:', cookieFilePath);
    console.log('[可选操作]:如有新cookie请复制到以上文件(' + cookieTxt + ')中,以下载与账号权限匹配的视频质量.');
    isSetCookie = await stdinPlus.keySelectSync(['使用空cookie', '我已录入新cookie']);
  } else {
    isSetCookie = 1;
  }
  if (isSetCookie < 0) {
    console.log('取消退出');
    return false;
  }
  if (isSetCookie !== 0) {
    const newCookie = '' + Fs.readFileSync(cookieFilePath);
    biliTool.setCookie(newCookie);
    console.log('使用cookie: %s\n', newCookie);
  } else {
    console.log('使用空cookie \n');
  }
  outVideo.setSaveDirPath(saveDirPath);
  return true;
};


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
  title = title.replace('\\', '-').replace('/', '-');
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
    // 合并&转码视频
    if (outFormat === noMergeTxt) {
      console.log('跳过执行转码&合并');
      return;
    }
    await ktool.promi(outVideo.mergeVideos)(filePath.name, filePath.ext.substring(1), len, outFormat);
    // console.log('one done. cid:', cid);
  }
};




async function main() {

  if (!checkCookieFile()) {
    return;
  }

  let pNum = 0;
  let aid = await stdinPlus.questionSync('请输入BiliBili的av/BV号(或url):');
  if (aid.length < 6) {
    console.log('错误: url/av/BV号 录入错误');
    process.exit();
    return;
  }
  if (aid.indexOf('av') >= 0) {
    aid = aid.substring(aid.lastIndexOf('av') + 2);
  } else if (aid.indexOf('BV') >= 0) {
    aid = aid.substring(aid.lastIndexOf('BV'));
    if (aid.indexOf('/') > 0) {
      aid = aid.substring(0, aid.indexOf('/'));
    }
    aid = ('' + bv2av(aid)).trim();
    // 下面是通过api转换
    // const vInfo = await rp(`https://api.bilibili.com/x/web-interface/view?bvid=${aid}`);
    // aid = JSON.parse(vInfo).data.aid;
  }

  console.log('aid:[%s]', aid);

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
    const pNumStr = await stdinPlus.keySelectSync(pageArr, '请选择分P号:');
    pNum = parseInt(pNumStr);
    if (pNum < 0) {
      console.log('取消退出');
      process.exit();
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
  const qualityIndex = await stdinPlus.keySelectSync(qualityDesArr, '请选择下载质量？');
  if (qualityIndex < 0) {
    console.log('取消退出');
    process.exit();
    return;
  }
  const quality = qualityArr[qualityIndex];
  // console.log('quality', quality);


  const outFormatArr = ['mp4', 'mp3', noMergeTxt];
  const outFormatIndex = await stdinPlus.keySelectSync(outFormatArr, '请选择转码&合并的输出格式？');
  if (outFormatIndex < 0) {
    console.log('取消退出');
    process.exit();
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
    console.log('====> 所有任务完成.');
    process.exit();
  } catch (err) {
    console.error(err);
  }


}

exports.setCookie = biliTool.setCookie;
exports.main = main;


//