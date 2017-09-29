let athena = require("./lib/athena");

import {CODES, CHeraErr} from "./lib/Codes";


import {ReHandler, JwtVerify} from "./lib/Response";

import {GameModel} from "./model/GameModel";

import {MerchantModel} from "./model/MerchantModel";

import {UserModel,GameState} from "./model/UserModel";

import {SysConfigModel} from "./model/SysConfigModel";

import {RoleCodeEnum,SeatTypeEnum, SeatContentEnum, ToolIdEnum} from "./lib/Consts"

import {Util} from "./lib/Util"

const hashKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9eyJ1c2VyTmFtZSI6IkNaU1lfZGF5MTMwIi"


/**
 * 游戏状态更新
 * @param {*} event
 * @param {*} context
 * @param {*} cb 
 */
const updateState = async(event, context, cb) => {
  console.log(event);
  //json转换
  let [parserErr, requestParams] = athena.Util.parseJSON(event.body);
  if(parserErr) return cb(null, ReHandler.fail(parserErr));

  //检查参数是否合法
  let [checkAttError, errorParams] = athena.Util.checkProperties([
      {name : "gameId", type:"S"},
      {name : "key", type:"S"},
      {name : "status", type:"N", min:0, max:4}, //0：删除，1:在线,2:离线,3,维护，4：故障
  ], requestParams);
  if(checkAttError){
    Object.assign(checkAttError, {params: errorParams});
    return cb(null, ReHandler.fail(checkAttError));
  } 

  let {gameId, status, key} = requestParams;
  if(!Object.is(hashKey, key)) {
      return cb(null, ReHandler.fail(new CHeraErr(CODES.gameKeyError)));
  }
  //找到这个游戏
  let [gameErr, gameInfo] = await new GameModel().findByKindId(gameId);
  if(gameErr) {
      return cb(null, ReHandler.fail(new CHeraErr(CODES.gameKeyError)));
  }
  if(!gameInfo) {
      return cb(null, ReHandler.fail(new CHeraErr(CODES.gameNotExist)));
  }
  let [updateErr] = await new GameModel().update({gameType:gameInfo.gameType, gameId:gameInfo.gameId}, {gameStatus:status});
  if(updateErr) {
      return cb(null, ReHandler.fail(updateErr));
  }
  cb(null, ReHandler.success({data:{status}}));
}

/**
 * 获取游戏等待
 * @param {*} event 
 * @param {*} context 
 * @param {*} cb 
 */
const gameAwait = async(event, context, cb) => {
  console.log(event);
  //json转换
  let [parserErr, requestParams] = athena.Util.parseJSON(event.body);
  if(parserErr) return cb(null, ReHandler.fail(parserErr));

  //检查参数是否合法
  let [checkAttError, errorParams] = athena.Util.checkProperties([
      {name : "key", type:"S"}
  ], requestParams);
  if(checkAttError){
    Object.assign(checkAttError, {params: errorParams});
    return cb(null, ReHandler.fail(checkAttError));
  } 

  let {key} = requestParams;
  if(!Object.is(hashKey, key)) {
      return cb(null, ReHandler.fail(new CHeraErr(CODES.gameKeyError)));
  }
  let [err, sysModel] = await new SysConfigModel().get({code:"queue"});
  if(err) {
      return cb(null, ReHandler.fail(err));
  }
  if(!sysModel || sysModel.status == 0) {
      return cb(null, ReHandler.success({data:null}));
  }
  return cb(null, ReHandler.success({data:sysModel}));
}
/**
 * 玩家退出游戏
 * @param {*} event 
 * @param {*} context 
 * @param {*} cb 
 */
const playerOffline = async(event, context, cb) => {
  console.log(event);
  //json转换
  let [parserErr, requestParams] = athena.Util.parseJSON(event.body);
  if(parserErr) return cb(null, ReHandler.fail(parserErr));

  //检查参数是否合法
  let [checkAttError, errorParams] = athena.Util.checkProperties([
      {name : "userId", type:"N"}
  ], requestParams);
  if(checkAttError){
    Object.assign(checkAttError, {params: errorParams});
    return cb(null, ReHandler.fail(checkAttError));
  } 
  let {userId, token} = requestParams;
  //验证token
  let [err, tokenInfo] = await Util.jwtVerify(event.headers.Authorization);
  if(err ||  !tokenInfo || !Object.is(+userId, +tokenInfo.userId)){
    return cb(null, ReHandler.fail(new CHeraErr(CODES.TokenError)));
  }
  if(!Object.is(hashKey, key)) {
      return cb(null, ReHandler.fail(new CHeraErr(CODES.gameKeyError)));
  }
  let [userErr, userInfo] = await new UserModel().get({userId:userId},[], "userIdIndex");
  if(userErr) {
      return cb(null, ReHandler.fail(userErr));
  }
  if(!userInfo) {
      return cb(null, ReHandler.fail(CODES.userNotExist));
  }
  let [updateErr] = await new UserModel().updateGameState(userInfo.userName, GameState.offline);
  if(userErr) {
      return cb(null, ReHandler.fail(updateErr));
  }
  return cb(null, ReHandler.success({}));
}

/**
 * 商户信息
 * @param {*} event 
 * @param {*} context 
 * @param {*} cb 
 */
const merchantInfo = async(event, context, cb) => {
  console.log(event);
  //json转换
  let [parserErr, requestParams] = athena.Util.parseJSON(event.body);
  if(parserErr) return cb(null, ReHandler.fail(parserErr));
  //检查参数是否合法
  let [checkAttError, errorParams] = athena.Util.checkProperties([
      {name : "parentId", type:"S"}
  ], requestParams);
  if(checkAttError){
    Object.assign(checkAttError, {params: errorParams});
    return cb(null, ReHandler.fail(checkAttError));
  }
  let [merErr, merchant] = await new MerchantModel().findByUserId(requestParams.parentId);
  if(merErr) {
      return cb(null, ReHandler.fail(merErr));
  }
  if(!merchant) {
      return cb(null, ReHandler.fail(new CHeraErr(CODES.merchantNotExist)));
  }
  let returnObj = {
        username : merchant.username,
        id :merchant.userId,
        role : merchant.role,
        headPic : "NULL!",
        parentId : merchant.parent,
        msn : merchant.msn || "0",
        gameList : setGameList(merchant.gameList),
        liveMix : typeof merchant.liveMix == "undefined" ? -1 : merchant.liveMix,
        vedioMix : typeof merchant.vedioMix == "undefined" ? -1 : merchant.vedioMix,
        rate :  typeof merchant.rate == "undefined" ? -1 : merchant.rate,
        nickname : merchant.displayName || "NULL!",
        suffix : merchant.suffix,
        levelIndex : merchant.levelIndex + "",
        merUrl : merchant.frontURL || "-1"
}
 function setGameList(gameList){
    gameList = gameList || [];
    let list = gameList.map((game) => game.code);
    return list;
}
if(merchant.role == RoleCodeEnum.SuperAdmin || merchant.role == RoleCodeEnum.PlatformAdmin || merchant.role == RoleCodeEnum.Agent) {
    returnObj.gameList = ["10000", "30000","40000"]
}
  return cb(null, ReHandler.success(returnObj));
}

export{
    updateState,
    gameAwait,
    playerOffline,
    merchantInfo
}