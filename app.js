#! /usr/bin/env node
'use strict';
const bili = require('./lib/bili');
const args = process.argv;
if(args.length > 2 && args[2].toLowerCase().charAt(0) === 'y'){
  const youtb = require('./lib/youtb');
  youtb.main();
} else {
  const cookie = '_uuid=D408C41E-17CC-C84F-4A51-6D43E2D7DDFD72708infoc; blackside_state=1; CURRENT_FNVAL=80; c=SMZXvCyP-1601869558236-a6e7b86f6f37a-253207689; _fmdata=IPmLNCxgXcD%2BqF0M%2FuedrzjFPrpZ32ADz%2BeKhbryx5DqO5KYnv%2FqsoLa8tnjMq7tDFqMTCOYtTBldGBIIat%2BrW7d2pAX4Nxe%2BqgCHFDMWsI%3D; _xid=6vBAE42KgD8ZUY4ptHD7kfrv4IFUxMCBc6VOAcrDJ1BlgGHvjTrYeQ7TK5%2BAdfHijJner3uHKJzm9F5d3Ua5kA%3D%3D; DedeUserID=39048600; DedeUserID__ckMd5=aed3d1d56ce1f588; SESSDATA=c4172d81%2C1617840485%2Cd953f*a1; bili_jct=454a230dab808e6191921192cd4399bc; CURRENT_QUALITY=116; PVID=1; buivd_fp=24B04184-4D75-4CAA-B7CA-BD2D48B82BDA155645infoc; buvid_fp_plain=24B04184-4D75-4CAA-B7CA-BD2D48B82BDA155645infoc; fingerprint3=62915d7150c58dbec64ac5ed94419571; buvid_fp=24B04184-4D75-4CAA-B7CA-BD2D48B82BDA155645infoc; bp_video_offset_39048600=484452902040271859; bp_t_offset_39048600=484454405279882966; fingerprint=3a5a82789a1e38324bf902a8d91eb1e5; fingerprint_s=65eb3233d245336090d5c36d58e25900; bsource=pc_sem_baidu_dm; sid=b8zr2akm';
  bili.setCookie(cookie);
  bili.main();
}
