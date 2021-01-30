## 运行
### 下载B站视频:
1. 修改app.js中的cookie;
2. node app.js


### 下载youtube:
1. 修改youtb.js的相关值
2. node youtb.js




### BilibiliVideoDownload
----
PC端下载bilibili视频

### 运行

0. [安装ffmpeg](http://ffmpeg.org/download.html) (视频合并转码会用到)

1. git clone https://github.com/blogwy/BilibiliVideoDownload.git

2. cd BilibiliVideoDownload

3. npm i

4. node app.js

### 实现的功能
----
1. 视频下载
2. 视频合并
3. 视频转码
4. 分P检测
5. 分P下载
6. 大会员清晰度下载(1080p60,720p60,1080p+)

### 注意的问题
----
1. 运行时先配置cookie

### 用到的接口

- https://api.bilibili.com/x/player/playurl?avid=44743619&cid=78328965&qn=80&otype=json

- https://api.bilibili.com/x/web-interface/view?aid=44743619
