let athena = require("./lib/athena");

import { CODES, CHeraErr } from "./lib/Codes";

import { Util } from "./lib/Util"

import { ReHandler, JwtVerify } from "./lib/Response";

import { Model } from "./lib/Dynamo";

import { EmailModel } from "./model/EmailModel"

import { UserModel } from "./model/UserModel"

import { MerchantModel } from "./model/MerchantModel"

import { ToolModel } from "./model/ToolModel"

import { RoleCodeEnum, GameTypeEnum } from "./lib/Consts"
import { BaseModel } from './model/BaseModel'
import _ from 'lodash'

/**
 * 添加邮件
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
    { name: "title", type: "S", min: 1, max: 20 },
    { name: "content", type: "S", min: 1, max: 200 },
    { name: "tools", type: "J" },
    { name: "sendTime", type: "N" }
  ], requestParams);

  if (checkAttError) {
    Object.assign(checkAttError, { params: errorParams });
    return errorHandle(cb, checkAttError);
  }
  //变量
  let { tools, kindId } = requestParams;
  //检查tools格式是否正确
  for (let i = 0; i < tools.length; i++) {
    let tool = tools[i];
    if (!tool.sum || !tool.contentType) { //如果缺少数量,以及是礼包还是道具字段
      return errorHandle(cb, new CHeraErr(CODES.DataError));
    }
  }
  requestParams.sendUserId = userInfo.userId;
  requestParams.sendUser = userInfo.displayName;
  //检查道具数量
  if (tools.length > 12) {
    return errorHandle(cb, new CHeraErr(CODES.toolMoreThan));
  }


  //找道具
  // let toolModel = new ToolModel();
  // for(let i = 0; i < tools.length; i++) {
  //   if(!tools[i].toolId) {
  //     let cError = new CHeraErr(CODES.DataError);
  //     Object.assign(cError,{params:["tools"]});
  //     return errorHandle(cb, cError);
  //   }
  // }
  // let toolIds = tools.map((item) => item.toolId);
  // let [toolListError, toolList] = await toolModel.findByIds(toolIds);
  // //如果道具数量不相等，道具ID有误，返回错误
  // if(toolList.length != toolIds.length) {
  //   return errorHandle(cb, new CHeraErr(CODES.toolNotExist));
  // }
  // //填充邮件道具实体
  let nickname = requestParams.nickname;
  if (nickname) {
    let [nickNameErr, nickUser] = await new UserModel().getUserByNickname(nickname);
    if (nickNameErr) {
      return errorHandle(cb, nickNameErr);
    }
    if (!nickUser) {
      return errorHandle(cb, new CHeraErr(CODES.userNotExist));
    }
    requestParams.userId = nickUser.userId;
  }
  requestParams.operatorName = userInfo.username
  requestParams.operatorRole = userInfo.role
  requestParams.operatorMsn = userInfo.msn || Model.StringValue
  requestParams.operatorId = userInfo.userId
  requestParams.operatorDisplayName = userInfo.displayName
  let emailModel = new EmailModel(requestParams)
  let [saveErr] = await emailModel.save();
  if (saveErr) {
    return errorHandle(cb, saveErr);
  }
  cb(null, ReHandler.success({ data: emailModel.setProperties() }));
}



/**
 * 修改邮件
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
    { name: "emid", type: "S" },
    { name: "title", type: "S" },
    { name: "content", type: "S" },
    { name: "tools", type: "J" },
    { name: "sendTime", type: "N" },
    { name: "kindId", type: "S" },
    { name: "msn", type: "N" }
  ], requestParams);
  if (checkAttError) {
    Object.assign(checkAttError, { params: errorParams });
    return errorHandle(cb, checkAttError);
  }
  let { emid, kindId, tools } = requestParams;
  //找到这个邮件
  let [getErr, emailInfo] = await new EmailModel().get({ emid });
  if (getErr) {
    return errorHandle(cb, getErr);
  }
  if (!emailInfo) {
    return errorHandle(cb, new CHeraErr(CODES.emailNotExist));
  }
  if (emailInfo.sendTime < Date.now()) {
    return errorHandle(cb, new CHeraErr(CODES.emailUpdateError));
  }
  //根据kindId找到游戏
  if (requestParams.kindId == -1) {
    requestParams.gameName = "全部";
  } else {
    let gameInfo = GameTypeEnum[kindId]
    if (!gameInfo) {
      return errorHandle(cb, new CHeraErr(CODES.gameNotExist));
    }
    requestParams.gameName = gameInfo.name;
  }
  //找道具
  let toolModel = new ToolModel();
  for (let i = 0; i < tools.length; i++) {
    if (!tools[i].toolId) {
      let cError = new CHeraErr(CODES.DataError);
      Object.assign(cError, { params: ["tools"] });
      return errorHandle(cb, cError);
    }
  }
  let toolIds = tools.map((item) => item.toolId);
  let [toolListError, toolList] = await toolModel.findByIds(toolIds);
  //如果道具数量不相等，道具ID有误，返回错误
  if (toolList.length != toolIds.length) {
    return errorHandle(cb, new CHeraErr(CODES.toolNotExist));
  }
  console.log(toolList);
  //填充邮件道具实体
  let emailModel = new EmailModel(requestParams);
  emailModel.setTools(toolList, tools);
  delete emailModel.emid;
  let [updateErr] = await emailModel.update({ emid: requestParams.emid }, emailModel);
  if (updateErr) {
    return errorHandle(cb, updateErr);
  }
  cb(null, ReHandler.success({ data: emailModel.setProperties() }));
}

/**
 * 邮件列表
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
    TableName: 'HawkeyeGameEmail',
    FilterExpression: 'operatorRole = :operatorRole',
    ExpressionAttributeValues: {
      ':operatorRole': requestParams.operatorRole || RoleCodeEnum.PlatformAdmin
    }
  }
  if (!Model.isPlatformAdmin(userInfo)) {
    query = {
      TableName: 'HawkeyeGameEmail',
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
 * 道具列表
 * @param {*} e 
 * @param {*} c 
 * @param {*} cb 
 */
const toolList = async (e, c, cb) => {
  let [beforeErr, userInfo] = await validateToken(e);
  if (beforeErr) {
    return errorHandle(cb, beforeErr);
  }
  let [parserErr, requestParams] = athena.Util.parseJSON(e.body || {});
  if (parserErr) return errorHandle(cb, parserErr);
  let [scanErr, list] = await new ToolModel().scan({});
  if (scanErr) {
    return errorHandle(cb, scanErr);
  }
  let reList = list.map((item) => {
    return { toolId: item.toolId, toolName: item.toolName }
  });
  cb(null, ReHandler.success({ list: reList }));
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
    { name: "emid", type: "S" }
  ], requestParams);
  if (checkAttError) {
    Object.assign(checkAttError, { params: errorParams });
    return errorHandle(cb, checkAttError);
  }
  //找到这个邮件
  let [getErr, emailInfo] = await new EmailModel().get({ emid: requestParams.emid });
  if (getErr) {
    return errorHandle(cb, getErr);
  }
  if (!emailInfo) {
    return errorHandle(cb, new CHeraErr(CODES.emailNotExist));
  }
  if (emailInfo.sendTime < Date.now()) {
    return errorHandle(cb, new CHeraErr(CODES.emailUpdateError));
  }
  let [removeErr] = await new EmailModel().remove({ emid: requestParams.emid });
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
  list,
  toolList,
  remove
}