let athena = require("./lib/athena");

import {CODES, CHeraErr} from "./lib/Codes";

import {Util} from "./lib/Util"

import {ReHandler, JwtVerify} from "./lib/Response";

import {Model} from "./lib/Dynamo";

import {NoticeModel} from "./model/NoticeModel"

import {MerchantModel} from "./model/MerchantModel"

import {RoleCodeEnum, GameTypeEnum} from "./lib/Consts"

import { TokenModel } from './model/TokenModel'

/**
 * 添加公告
 * @param {*} e 
 * @param {*} c 
 * @param {*} cb 
 */
const add = async(e, c, cb) => {
  let [beforeErr, userInfo] = await validateToken(e);
  if(beforeErr) {
    return errorHandle(cb, beforeErr);
  }
  let [parserErr, requestParams] = athena.Util.parseJSON(e.body || {});
  if(parserErr) return errorHandle(cb, parserErr);
  //检查参数是否合法
  let [checkAttError, errorParams] = athena.Util.checkProperties([
      {name : "content", type:"S", min:1, max:200},
      {name : "showTime", type:"N"},
      {name : "startTime", type:"N"},
      {name : "endTime", type:"N"},
      {name : "splitTime", type:"N"},
      {name : "count", type:"N"},
  ], requestParams);
  if(checkAttError){
      Object.assign(checkAttError, {params: errorParams});
      return errorHandle(cb, checkAttError);
  }
 
  requestParams.userId = userInfo.userId;
  let noticeModel = new NoticeModel(requestParams);
  let [saveErr] = await noticeModel.save();
  if(saveErr) {
    return errorHandle(cb, saveErr);
  }
  cb(null, ReHandler.success({data:noticeModel.setProperties()}));
}

function getGameName(requestParams){
  //根据kindId找到游戏
  let gameName = '';
  if(requestParams.kindId == 0) {
    gameName = "广场";
  }else if(requestParams.kindId == -1) {
    gameName = "所有游戏";
  }else{
    let gameInfo = GameTypeEnum[requestParams.kindId]
    gameName = gameInfo.name;
    if(!gameInfo) {
      return [new CHeraErr(CODES.gameNotExist), gameName]
    }
  }
  return [null, gameName];
}

/**
 * 修改公告
 * @param {*} e 
 * @param {*} c 
 * @param {*} cb 
 */
const update = async(e, c, cb) => {
  let [beforeErr, userInfo] = await validateToken(e);
  if(beforeErr) {
    return errorHandle(cb, beforeErr);
  }
  let [parserErr, requestParams] = athena.Util.parseJSON(e.body || {});
  if(parserErr) return errorHandle(cb, parserErr);
  //检查参数是否合法
  let [checkAttError, errorParams] = athena.Util.checkProperties([
      {name : "content", type:"S", min:1, max:200},
      {name : "showTime", type:"N"},
      {name : "noid", type:"S"},
      {name : "startTime", type:"N"},
      {name : "endTime", type:"N"},
      {name : "splitTime", type:"N"},
      {name : "count", type:"N"},
  ], requestParams);
  if(checkAttError){
    Object.assign(checkAttError, {params: errorParams});
    return errorHandle(cb, checkAttError);
  }
  //找到这个公告
  let [getErr, noticeInfo] = await new NoticeModel().get({noid:requestParams.noid});
  if(getErr) {
    return errorHandle(cb, getErr);
  }
  if(!noticeInfo) {
    return errorHandle(cb, new CHeraErr(CODES.noticeNotExist));
  }
  let noticeModel = new NoticeModel(requestParams);
  delete noticeModel.noid;
  let [updateErr] = await noticeModel.update({noid:requestParams.noid}, noticeModel);
  if(updateErr) {
    return errorHandle(cb, updateErr);
  }
  cb(null, ReHandler.success({data:noticeModel.setProperties()}));
}

/**
 * 公告列表
 * @param {*} e 
 * @param {*} c 
 * @param {*} cb 
 */
const list = async(e, c, cb) => {
  let [beforeErr, userInfo] = await validateToken(e);
  if(beforeErr) {
    return errorHandle(cb, beforeErr);
  }
  let [parserErr, requestParams] = athena.Util.parseJSON(e.body || {});
  if(parserErr) return errorHandle(cb, parserErr);
  let [scanErr, list] = await new NoticeModel().scan({});
  if(scanErr) {
    return errorHandle(cb, scanErr);
  } 
  cb(null, ReHandler.success({list}));
}

/**
 * 商家列表
 * @param {*} e 
 * @param {*} c 
 * @param {*} cb 
 */
const merchantList = async(e, c, cb) => {
  let [beforeErr, userInfo] = await validateToken(e);
  if(beforeErr) {
    return errorHandle(cb, beforeErr);
  }
  let [parserErr, requestParams] = athena.Util.parseJSON(e.body || {});
  if(parserErr) return errorHandle(cb, parserErr);
  let merchantModel = new MerchantModel();
  let [merchantErr, merchantList] = await merchantModel.all();
  if(merchantErr) {
    return errorHandle(cb, merchantErr);
  }
  merchantList = merchantList || [];
  let returnList = merchantList.map((item) => {
    return {
      msn : item.msn,
      displayName : item.displayName
    }
  })
  returnList.unshift({
    msn : -1,
    displayName : "所有"
  });
  cb(null, ReHandler.success({list:returnList}));
}

/**
 * 删除
 * @param {*} e 
 * @param {*} c 
 * @param {*} cb 
 */
const remove = async(e, c, cb) => {
  let [beforeErr, userInfo] = await validateToken(e);
  if(beforeErr) {
    return errorHandle(cb, beforeErr);
  }
  let [parserErr, requestParams] = athena.Util.parseJSON(e.body || {});
  //检查参数是否合法
  let [checkAttError, errorParams] = athena.Util.checkProperties([
    {name : "noid", type:"S"}
  ], requestParams);
  if(checkAttError){
    Object.assign(checkAttError, {params: errorParams});
    return errorHandle(cb, checkAttError);
  }
  //找到这个公告
  let [getErr, noticeInfo] = await new NoticeModel().get({noid:requestParams.noid});
  if(getErr) {
    return errorHandle(cb, getErr);
  }
  if(!noticeInfo) {
    return errorHandle(cb, new CHeraErr(CODES.noticeNotExist));
  }
  let [removeErr] = await new NoticeModel().remove({noid:requestParams.noid});
  if(removeErr) {
    return errorHandle(cb, removeErr);
  }
  cb(null, ReHandler.success());
}

/**
 * 验证token
 * @param {*} e 
 * @param {*} validateParams 
 */
const validateToken = async(e) => {
    //json转换
    const [tokenErr, token] = await Model.currentToken(e);
    if (tokenErr) {
        return [tokenErr, null];
    }
    const [te, tokenInfo] = await JwtVerify(token[1])
    if(te) {
        return [te, nuyll];
    }
    let role = tokenInfo.role;
    let userId = tokenInfo.userId;
    let displayId = +tokenInfo.displayId;
    if(role != RoleCodeEnum.PlatformAdmin && role != RoleCodeEnum.Manager) {
      return [new CHeraErr(CODES.notAuth), null];
    }
    return [null, {userId, displayId}];
}

/**
 * 错误处理
 */
const errorHandle = (cb, error) =>{
  let errObj = {};
    errObj.err = error;
    errObj.code = error.code;
    cb(null, ReHandler.fail(errObj));
}

export{
    add,
    update,
    merchantList,
    remove,
    list
}

// TOKEN验证
export const jwtverify = async (e, c, cb) => {
  // get the token from event.authorizationToken
  const token = e.authorizationToken.split(' ')
  if (token[0] !== 'Bearer') {
    return c.fail('Unauthorized: wrong token type')
  }
  // verify it and return the policy statements
  const [err, userInfo] = await JwtVerify(token[1]);
  if (err || !userInfo) {
    console.log(JSON.stringify(err), JSON.stringify(userInfo));
    return c.fail('Unauthorized')
  }
  const [checkErr, checkRet] = await new TokenModel(userInfo).checkExpire(userInfo);
  if (checkErr) {
    return c.succeed(Util.generatePolicyDocument(-1, 'Allow', e.methodArn, userInfo))
    // return c.fail(checkErr.msg)
  } else {
    return c.succeed(Util.generatePolicyDocument(userInfo.userId, 'Allow', e.methodArn, userInfo))
  }

}
