# bk
* 下载B站(Bilibili)视频
* 下载youtube(使用youtube-dl)

## 安装
1. 安装nodejs
2. 安装ffmpeg (http://ffmpeg.org/download.html)
3. 命令行执行:
```
npm i -g bk
```

## 运行
### 下载B站视频:
1. 使用B站账号登录,并从视频详情页面中获取cookie(注意其中会包含"_uuid=");
2. 命令行运行
```
bk
```

### 下载youtube视频:
1. 命令行运行
```
bk y
```

-----

## 实现的功能
1. 视频下载
2. 视频合并
3. 视频转码
4. 分P检测
5. 分P下载
6. 转码格式定义
7. 一次下载所有分P

## 注意的问题
* 运行时先配置cookie

### 用到的接口
* https://api.bilibili.com/x/player/playurl?avid=${avid}&cid=${cid}&qn={qn}&otype=json
* https://api.bilibili.com/x/web-interface/view?aid=${avid}
