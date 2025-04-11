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

const XOR_CODE = 23442827791579n;
const MASK_CODE = 2251799813685247n;
const MAX_bvid = 1n << 51n;
const BASE = 58n;
const data = 'FcwAPNKTMug3GV5Lj7EJnHpWsx4tb8haYeviqBz6rkCy12mUSDQX9RdoZf';

const bv2av = function(bvid) {
  const bvidArr = Array.from(bvid);
  [bvidArr[3], bvidArr[9]] = [bvidArr[9], bvidArr[3]];
  [bvidArr[4], bvidArr[7]] = [bvidArr[7], bvidArr[4]];
  bvidArr.splice(0, 3);
  const tmp = bvidArr.reduce((pre, bvidChar) => pre * BASE + BigInt(data.indexOf(bvidChar)), 0n);
  return Number((tmp & MASK_CODE) ^ XOR_CODE);

};


// 质量值对应
// '高清1080P60(大会员)': 116,
// '高清1080P+(大会员)': 112,
// '高清1080P': 80,
// '高清720P60(大会员)': 74,
// '高清720P': 64,
// '清晰480P': 32,
// '流畅360P': 16,

const downloadOne = async function(bvid, cid, title, pNum, quality, outFormat, isNeedQulityCheck) {
  let oneQality = -1;
  title = title.replace('\\', '-').replace('/', '-');
  if (isNeedQulityCheck) {
    const dInfo = await biliTool.getDownloadInfo(bvid, cid, 16);
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
  const downloadInfo = await biliTool.getDownloadInfo(bvid, cid, oneQality);
  // console.log('downloadInfo',downloadInfo);
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
    const downloadResult = await biliTool.downloadFile(bvid, item.size, item.length, item.url, `[p${pNum}]${title}-${i}` + extName);
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
  let input = await stdinPlus.questionSync('请输入BiliBili的av/BV号(或url):');
  if (input.length < 6) {
    console.log('错误: url/av/BV号 录入错误');
    process.exit();
    return;
  }
  let p1 = input.lastIndexOf('BV1');
  if (p1 < 0) {
    console.log('错误: url/av/BV号 录入错误');
    process.exit();
    return;
  }
  let bvid = input.substring(p1);
  p1 = bvid.indexOf('/');
  if (p1 > 0) {
    bvid = bvid.substring(0, p1);
  }
  bvid = bvid.trim();
  console.log('bvid:[%s]', bvid);

  // 检查是否是多P
  const videoInfo = await biliTool.getVideoInfo(bvid);
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

  const downloadInfo = await biliTool.getDownloadInfo(bvid, videoInfo.cid, 16);
  // console.log('downloadInfo',downloadInfo);
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
      await downloadOne(bvid, vOne.cid, vOne.part || videoInfo.title, pNum + 1, quality, outFormat);
    } else {
      for (let i = 0, len = videoInfo.pages.length; i < len; i++) {
        const vOne = videoInfo.pages[i];
        await downloadOne(bvid, vOne.cid, vOne.part, vOne.page, quality, outFormat, true);
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