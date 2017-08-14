import athena from "./lib/athena";

import {CODES, CHeraErr} from "./lib/Codes";

import {ReHandler, JwtVerify} from "./lib/Response";

import {Model} from "./lib/Dynamo";

import {NoticeModel} from "./model/NoticeModel"

import {GameModel} from "./model/GameModel"

import {RoleCodeEnum} from "./lib/Consts"

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
  let [parserErr, requestParams] = athena.Util.parseJSON(event.body || {});
  if(parserErr) return errorHandle(cb, parserErr);
  //检查参数是否合法
  let [checkAttError, errorParams] = athena.Util.checkProperties([
      {name : "content", type:"S"},
      {name : "showTime", type:"N"},
      {name : "startTime", type:"N"},
      {name : "endTime", type:"N"},
      {name : "splitTime", type:"N"},
      {name : "kindId", type:"S"},
  ], requestParams);
  if(checkAttError){
      Object.assign(checkAttError, {params: errorParams});
      return errorHandle(cb, checkAttError);
  }
  //根据kindId找到游戏
  let gameModel = new GameModel();
  let [gameErr, gameInfo] = await gameModel.findByKindId(requestParams.kindId);
  if(gameErr) {
    return errorHandle(cb, gameErr);
  }
  if(!gameInfo) {
    return errorHandle(cb, new CHeraErr(CODES.gameNotExist));
  }
  requestParams.userId = userInfo.userId;
  requestParams.gemeName = gameInfo.gameName;
  let noticeModel = new NoticeModel(requestParams);
  let [saveErr] = await noticeModel.save();
  if(saveErr) {
    return errorHandle(cb, saveErr);
  }
  cb(null, ReHandler.success(noticeModel));
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
  let [parserErr, requestParams] = athena.Util.parseJSON(event.body || {});
  if(parserErr) return errorHandle(cb, parserErr);
  //检查参数是否合法
  let [checkAttError, errorParams] = athena.Util.checkProperties([
    {name : "noid", type:"S"},
    {name : "content", type:"S"},
    {name : "showTime", type:"N"},
    {name : "startTime", type:"N"},
    {name : "endTime", type:"N"},
    {name : "splitTime", type:"N"},
    {name : "kindId", type:"S"},
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
  let [updateErr] = await noticeModel.update({noid:requestParams.noid});
  if(updateErr) {
    return errorHandle(cb, updateErr);
  }
  cb(null, ReHandler.success(noticeModel));
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
  let [parserErr, requestParams] = athena.Util.parseJSON(event.body || {});
  if(parserErr) return errorHandle(cb, parserErr);
  let [scanErr, list] = new NoticeModel().scan({});
  if(scanErr) {
    return errorHandle(cb, scanErr);
  } 
  cb(null, ReHandler.success({list}));
}

/**
 * 游戏列表
 * @param {*} e 
 * @param {*} c 
 * @param {*} cb 
 */
const gameList = async(e, c, cb) => {
  let [beforeErr, userInfo] = await validateToken(e);
  if(beforeErr) {
    return errorHandle(cb, beforeErr);
  }
  let [parserErr, requestParams] = athena.Util.parseJSON(event.body || {});
  if(parserErr) return errorHandle(cb, parserErr);
  let gameModel = new GameModel();
  let [gameErr, gameList] = await gameModel.scan({});
  if(gameErr) {
    return errorHandle(cb, gameErr);
  }
  cb(null, ReHandler.success({list:gameList}));
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
  let [parserErr, requestParams] = athena.Util.parseJSON(event.body || {});
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
    const [tokenErr, token] = await Model.currentToken(event);
    if (tokenErr) {
        return [tokenErr, null];
    }
    const [e, tokenInfo] = await JwtVerify(token[1])
    if(e) {
        return [e, nuyll];
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
    gameList,
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
  return c.succeed(Util.generatePolicyDocument(userInfo.userId, 'Allow', e.methodArn, userInfo))
}
