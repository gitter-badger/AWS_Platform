let athena = require("./lib/athena");

import {CODES, CHeraErr} from "./lib/Codes";


import {ReHandler, JwtVerify} from "./lib/Response";

import {GameModel} from "./model/GameModel";

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


export{
    updateState,
    gameAwait,
}