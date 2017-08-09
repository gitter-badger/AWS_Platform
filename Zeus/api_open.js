
import {Util} from "./lib/athena";

import {
  Success,
  Fail,
  Codes,
  Model,
  BizErr,
} from './lib/all'

import {GameTypeEnum} from "./lib/Consts"

import {GameModel} from "./model/GameModel"

import crypto from "crypto";

import {httpRequest}  from "./lib/HttpsUtil";

const ResOK = (callback, res, code) => callback(null, Success(res, code))
const ResFail = (callback, res, code = Codes.Error) => callback(null, Fail(res, code))
const ResErr = (callback, err) => ResFail(callback, { err: err }, err.code)

async function gameLoginSign(event, context, callback){
  console.log(event);
  const [tokenErr, token] = await Model.currentToken(event)
  if (tokenErr) {
    return ResFail(callback, { ...errRes, err: tokenErr }, tokenErr.code)
  }
//   console.log("1111111111");
//   console.log(token);
  if(!token) {
      return ResFail(callback, BizErr.TokenErr());
  }
    //json转换
  event = event || {};
  let [parserErr, requestParams] = Util.parseJSON(event.body);
  if(parserErr) return callback(null, ResFail(callback, parserErr));
  
  //检查参数是否合法
  let [checkAttError, errorParams] = Util.checkProperties([
      {name : "gameType", type:"N"}
  ], requestParams); 
  if(checkAttError){
    Object.assign(checkAttError, {params: errorParams});
    return callback(null, ResFail(callback, checkAttError));
  } 
//   console.log("token");
//   console.log(token);
  let timestamp = Date.now();
  requestParams.id = token.userId;
  requestParams.timestamp = timestamp;
  //找到游戏厂商的gameKey
  let gameModel = new GameModel();
  let [error, game] = await gameModel.findSingleByType(requestParams.gameType);
  if(error) {
      return ResFail(callback, error);
  }
  if(!game) {
      return ResFail(callback, BizErr.CompanyNotExistError());
  }
  let company = game.company || {};
  
  let gameKey = company.companyKey;
  let sign = getSign(gameKey, ["id","timestamp"], requestParams);
  let [httpError, data] = await httpRequest((GameTypeEnum[requestParams.gameType] || {}).url,
         {sign:sign, id: token.userId, timestamp});
  if(httpError) {
      return ResFail(callback, httpError);
  }
  ResOK(callback, data, data.code);
}

function getSign(secret, args, msg){
    var paramArgs = [];
    if(args instanceof Array){
        paramArgs = args;
    }else{
        for(var key in args){
            paramArgs.push(key);
        }
    }
    var signValue = '';
    var paramNameAndValueArray = [];
    for(var i = 0,l = paramArgs.length; i<l; i++){
        var msgValue = msg[paramArgs[i]];
        paramNameAndValueArray[i] = paramArgs[i]  + msgValue;
    }
    paramNameAndValueArray.sort();
    for(var i= 0,l=paramNameAndValueArray.length; i<l; i++) {
        signValue += paramNameAndValueArray[i];
    }
    console.log(signValue);
    //首尾加上秘钥

    signValue = encodeURIComponent(signValue);
    signValue = secret + signValue + secret;
    signValue = crypto.createHash('sha256').update(signValue).digest('hex');
    return signValue;
}

export{
    gameLoginSign
}