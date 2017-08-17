let athena = require("./lib/athena");

import {CODES, CHeraErr} from "./lib/Codes";


import {ReHandler, JwtVerify} from "./lib/Response";


import {NoticeModel} from "./model/NoticeModel"

import {EmailModel} from "./model/EmailModel"




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
 * 错误处理
 */
const errorHandle = (cb, error) =>{
    cb(null, ReHandler.fail(error));
}
export{
    info,
    emailInfo
}


