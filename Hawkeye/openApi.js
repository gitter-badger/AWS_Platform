let athena = require("./lib/athena");

import {CODES, CHeraErr} from "./lib/Codes";


import {ReHandler, JwtVerify} from "./lib/Response";

import {RoleCodeEnum,SeatTypeEnum, SeatContentEnum, ToolIdEnum} from "./lib/Consts"

import {NoticeModel} from "./model/NoticeModel"

import {PlayerEmailRecordModel} from "./model/PlayerEmailRecordModel"

import {EmailModel} from "./model/EmailModel"

import {UserDiamondBillModel} from "./model/UserDiamondBillModel"

import {Util} from "./lib/Util"

/**
 * 根据ID获取公告信息
 * @param {*} e 
 * @param {*} c 
 * @param {*} cb 
 */
const info = async(e, c, cb) => {
  console.log(e);
  //json转换
  let [parserErr, requestParams] = athena.Util.parseJSON(e.body);

  if(parserErr) return callback(null, ReHandler.fail(parserErr));
    //检查参数是否合法
  let [checkAttError, errorParams] = athena.Util.checkProperties([
      {name : "noid", type:"S"},
  ], requestParams);
  if(checkAttError){
    Object.assign(checkAttError, {params: errorParams});
    return callback(null, ReHandler.fail(checkAttError));
  } 
  let noid = requestParams.noid;
  //找到这个公告
  let [getErr, noticeInfo] = await new NoticeModel().get({noid:requestParams.noid});
  if(getErr) {
    return errorHandle(cb, getErr);
  }
  if(!noticeInfo) {
    return errorHandle(cb, new CHeraErr(CODES.noticeNotExist));
  }
  cb(null, ReHandler.success({data:noticeInfo}));
}
/**
 * 根据ID获取公告信息
 * @param {*} e 
 * @param {*} c 
 * @param {*} cb 
 */
const emailInfo = async(e, c, cb) => {
  console.log(e);
  //json转换
  let [parserErr, requestParams] = athena.Util.parseJSON(e.body);

  if(parserErr) return callback(null, ReHandler.fail(parserErr));
    //检查参数是否合法
  let [checkAttError, errorParams] = athena.Util.checkProperties([
      {name : "emid", type:"S"},
  ], requestParams);
  if(checkAttError){
    Object.assign(checkAttError, {params: errorParams});
    return callback(null, ReHandler.fail(checkAttError));
  } 
  let emid = requestParams.emid;
  //找到这个公告
  let [getErr, emailInfo] = await new EmailModel().get({emid});
  if(getErr) {
    return errorHandle(cb, getErr);
  }
  if(!emailInfo) {
    return errorHandle(cb, new CHeraErr(CODES.noticeNotExist));
  }
  cb(null, ReHandler.success({data:emailInfo}));
}

/**
 * 接收邮件
 * @param {*} e 
 * @param {*} c 
 * @param {*} cb 
 */
const acceptMail = async(e, c, cb) => {
  //json转换
  let [parserErr, requestParams] = athena.Util.parseJSON(e.body);
  if(parserErr) return callback(null, ReHandler.fail(parserErr));
    //检查参数是否合法
  let [checkAttError, errorParams] = athena.Util.checkProperties([
      {name : "emid", type:"S"},
      {name : "userId", type:"N"},
  ], requestParams);
  if(checkAttError){
    Object.assign(checkAttError, {params: errorParams});
    return callback(null, ReHandler.fail(checkAttError));
  }
  //验证token
  let {userId,emid} = requestParams;
  let [err, userInfo] = await Util.jwtVerify(e.headers.Authorization);
  if(err ||  !userInfo || !Object.is(+userId, +userInfo.userId)){
    return callback(null, ReHandler.fail(new CHeraErr(CODES.TokenError)));
  }

  //找到邮件
  console.log("找到邮件");
  let emailModel = new EmailModel();
  let [emailError, emailInfo] = await emailModel.get({emid});
  emailModel = new EmailModel(emailInfo);
  if(emailError) {
    return errorHandle(cb, emailError);
  }
  if(!emailInfo) {
    return errorHandle(cb, new CHeraErr(CODES.emailNotExist));
  }
  //检查邮件的归属
  let [userErr, flag] =  await emailModel.isUser(userId);
  if(userErr) {
    return errorHandle(cb, userErr);
  }
  if(!flag) {
    return errorHandle(cb, new CHeraErr(CODES.emailNotExist));
  }
  //查找该用户是否已接收该邮件
  let [recordErr, emailRecordInfo] = await new PlayerEmailRecordModel().get({userId, emid:emailInfo.emid});
  if(recordErr) {
    return errorHandle(cb, recordErr);
  }
  // 表示已经接收该邮件
  if(emailRecordInfo) {
    return errorHandle(cb, new CHeraErr(CODES.emailAlreadyAcceptError));
  }
  //接收邮件
  let tools = emailModel.tools || [];
  //钻石数量
  let diamonds = 0;
  tools.forEach(function(element) {
    let toolList = [];
    let sum = 1;
    if(element.contentType == SeatContentEnum.package) { //道具包
      sum = +element.sum || 1;
      toolList = element.content;
    }else { //道具
      toolList = [element]
    }
    let packageSumDiamond = 0; //包里面的总数量
    toolList.forEach(function(element) {
      if(element.toolId == ToolIdEnum.diamonds) {
        diamonds += sum*(+(element.toolNum || element.sum || 1));
      }
    })
  }, this);
  console.log("邮件钻石数量:"+diamonds);
  //玩家账单
  if(diamonds!=0) {
    //用户钻石发生变化
    let userDiamondBillModel = new UserDiamondBillModel({
      userId : userId,
      action :1,
      userName : userInfo.userName,
      msn : "000",
      diamonds : diamonds,
      kindId : requestParams.kindId
    })
    let [userDiamondsSaveErr] = await userDiamondBillModel.save();
    if(userDiamondsSaveErr) {
      return errorHandle(cb, userDiamondsSaveErr);
    }
  }
  //玩家接收邮件记录
  let emailRecord = new PlayerEmailRecordModel({
    userId,
    emid,
    emailInfo
  });
  let [recordSaveErr] = await emailRecord.save();
  if(recordSaveErr) {
    return errorHandle(cb, recordSaveErr);
  }
  //获取用户钻石
  let [diamondsError, userDiamonds] = await new UserDiamondBillModel({userName:userInfo.userName}).getBalance();
  if(diamondsError) {
    return cb(null, ReHandler.fail(diamondsError));
  }
  cb(null, ReHandler.success({data:{diamonds:userDiamonds}}));
}
/**
 * 错误处理
 */
const errorHandle = (cb, error) =>{
    cb(null, ReHandler.fail(error));
}
export{
    info,
    emailInfo,
    acceptMail
}


