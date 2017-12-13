let athena = require("./lib/athena");

import { CODES, CHeraErr } from "./lib/Codes";

import { Util } from "./lib/Util"

import { ReHandler, JwtVerify } from "./lib/Response";

import { Model } from "./lib/Dynamo";

import { NoticeModel } from "./model/NoticeModel"

import { MerchantModel } from "./model/MerchantModel"

import { RoleCodeEnum, GameTypeEnum } from "./lib/Consts"
import { BaseModel } from './model/BaseModel'
import _ from 'lodash'
/**
 * 添加跑马灯
 * @param {*} e 
 * @param {*} c 
 * @param {*} cb 
 */
const add = async (e, c, cb) => {
  let [beforeErr, userInfo] = await validateToken(e);
  if (beforeErr) {
    return errorHandle(cb, beforeErr);
  }
  let [parserErr, requestParams] = athena.Util.parseJSON(e.body || {});
  if (parserErr) return errorHandle(cb, parserErr);
  //检查参数是否合法
  let [checkAttError, errorParams] = athena.Util.checkProperties([
    { name: "content", type: "S", min: 1, max: 200 },
    { name: "showTime", type: "N" },
    { name: "startTime", type: "N" },
    { name: "endTime", type: "N" },
    { name: "splitTime", type: "N" },
    { name: "count", type: "N" },
  ], requestParams);
  if (checkAttError) {
    Object.assign(checkAttError, { params: errorParams });
    return errorHandle(cb, checkAttError);
  }
  requestParams.userId = userInfo.userId;
  requestParams.operatorName = userInfo.username;
  requestParams.operatorRole = userInfo.role;
  requestParams.operatorMsn = userInfo.msn || Model.StringValue;
  requestParams.operatorId = userInfo.userId;
  requestParams.operatorDisplayName = userInfo.displayName
  let noticeModel = new NoticeModel(requestParams);
  let [saveErr] = await noticeModel.save();
  if (saveErr) {
    return errorHandle(cb, saveErr);
  }
  cb(null, ReHandler.success({ data: noticeModel.setProperties() }));
}

function getGameName(requestParams) {
  //根据kindId找到游戏
  let gameName = '';
  if (requestParams.kindId == 0) {
    gameName = "广场";
  } else if (requestParams.kindId == -1) {
    gameName = "所有游戏";
  } else {
    let gameInfo = GameTypeEnum[requestParams.kindId]
    gameName = gameInfo.name;
    if (!gameInfo) {
      return [new CHeraErr(CODES.gameNotExist), gameName]
    }
  }
  return [null, gameName];
}

/**
 * 修改跑马灯
 * @param {*} e 
 * @param {*} c 
 * @param {*} cb 
 */
const update = async (e, c, cb) => {
  let [beforeErr, userInfo] = await validateToken(e);
  if (beforeErr) {
    return errorHandle(cb, beforeErr);
  }
  let [parserErr, requestParams] = athena.Util.parseJSON(e.body || {});
  if (parserErr) return errorHandle(cb, parserErr);
  //检查参数是否合法
  let [checkAttError, errorParams] = athena.Util.checkProperties([
    { name: "content", type: "S", min: 1, max: 200 },
    { name: "showTime", type: "N" },
    { name: "noid", type: "S" },
    { name: "startTime", type: "N" },
    { name: "endTime", type: "N" },
    { name: "splitTime", type: "N" },
    { name: "count", type: "N" },
  ], requestParams);
  if (checkAttError) {
    Object.assign(checkAttError, { params: errorParams });
    return errorHandle(cb, checkAttError);
  }
  //找到这个跑马灯
  let [getErr, noticeInfo] = await new NoticeModel().get({ noid: requestParams.noid });
  if (getErr) {
    return errorHandle(cb, getErr);
  }
  if (!noticeInfo) {
    return errorHandle(cb, new CHeraErr(CODES.noticeNotExist));
  }
  let noticeModel = new NoticeModel(requestParams);
  delete noticeModel.noid;
  let [updateErr] = await noticeModel.update({ noid: requestParams.noid }, noticeModel);
  if (updateErr) {
    return errorHandle(cb, updateErr);
  }
  cb(null, ReHandler.success({ data: noticeModel.setProperties() }));
}

/**
 * 跑马灯列表
 * @param {*} e 
 * @param {*} c 
 * @param {*} cb 
 */
const list = async (e, c, cb) => {
  let [beforeErr, userInfo] = await validateToken(e);
  if (beforeErr) {
    return errorHandle(cb, beforeErr);
  }
  let [parserErr, requestParams] = athena.Util.parseJSON(e.body || {});
  if (parserErr) return errorHandle(cb, parserErr);
  let query = {
    TableName: 'HawkeyeGameNotice',
    FilterExpression: 'operatorRole = :operatorRole',
    ExpressionAttributeValues: {
      ':operatorRole': requestParams.operatorRole || RoleCodeEnum.PlatformAdmin
    }
  }
  if (!Model.isPlatformAdmin(userInfo)) {
    query = {
      TableName: 'HawkeyeGameNotice',
      FilterExpression: 'operatorName = :operatorName',
      ExpressionAttributeValues: {
        ':operatorName': userInfo.username
      }
    }
  }
  // 条件搜索
  if (!_.isEmpty(requestParams.query)) {
    if (requestParams.query.createdAt) {
      requestParams.query.createdAt = { $range: requestParams.query.createdAt }
    }
    if (requestParams.query.operatorMsn) { requestParams.query.operatorMsn = requestParams.query.operatorMsn }
    if (requestParams.query.operatorDisplayName) { requestParams.query.operatorDisplayName = { $like: requestParams.query.operatorDisplayName } }
  }
  let [scanErr, list] = await new BaseModel().bindFilterScan(query, requestParams.query, false)
  if (scanErr) {
    return errorHandle(cb, scanErr);
  }
  cb(null, ReHandler.success({ list }));
}

/**
 * 商家列表
 * @param {*} e 
 * @param {*} c 
 * @param {*} cb 
 */
const merchantList = async (e, c, cb) => {
  let [beforeErr, userInfo] = await validateToken(e);
  if (beforeErr) {
    return errorHandle(cb, beforeErr);
  }
  let [parserErr, requestParams] = athena.Util.parseJSON(e.body || {});
  if (parserErr) return errorHandle(cb, parserErr);
  let merchantModel = new MerchantModel();
  let [merchantErr, merchantList] = await merchantModel.all();
  if (merchantErr) {
    return errorHandle(cb, merchantErr);
  }
  merchantList = merchantList || [];
  let returnList = merchantList.map((item) => {
    return {
      msn: item.msn,
      displayName: item.displayName
    }
  })
  returnList.unshift({
    msn: -1,
    displayName: "所有"
  });
  cb(null, ReHandler.success({ list: returnList }));
}

/**
 * 删除
 * @param {*} e 
 * @param {*} c 
 * @param {*} cb 
 */
const remove = async (e, c, cb) => {
  let [beforeErr, userInfo] = await validateToken(e);
  if (beforeErr) {
    return errorHandle(cb, beforeErr);
  }
  let [parserErr, requestParams] = athena.Util.parseJSON(e.body || {});
  //检查参数是否合法
  let [checkAttError, errorParams] = athena.Util.checkProperties([
    { name: "noid", type: "S" }
  ], requestParams);
  if (checkAttError) {
    Object.assign(checkAttError, { params: errorParams });
    return errorHandle(cb, checkAttError);
  }
  //找到这个跑马灯
  let [getErr, noticeInfo] = await new NoticeModel().get({ noid: requestParams.noid });
  if (getErr) {
    return errorHandle(cb, getErr);
  }
  if (!noticeInfo) {
    return errorHandle(cb, new CHeraErr(CODES.noticeNotExist));
  }
  let [removeErr] = await new NoticeModel().remove({ noid: requestParams.noid });
  if (removeErr) {
    return errorHandle(cb, removeErr);
  }
  cb(null, ReHandler.success());
}

/**
 * 验证token
 * @param {*} e 
 * @param {*} validateParams 
 */
const validateToken = async (e) => {
  try {
    //json转换
    const [tokenErr, token] = await Model.currentToken(e);
    return [null, token];
  } catch (error) {
    return [error, null];
  }
}

/**
 * 错误处理
 */
const errorHandle = (cb, error) => {
  let errObj = {};
  errObj.err = error;
  errObj.code = error.code;
  cb(null, ReHandler.fail(errObj));
}

export {
  add,
  update,
  merchantList,
  remove,
  list
}
