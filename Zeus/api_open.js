
import {Util} from "./lib/athena";

import {
  Success,
  Fail,
  Codes,
  Model,
  BizErr
} from './lib/all'

import {GameModel} from "./model/GameModel"

import crypto from "crypto";

const ResOK = (callback, res) => callback(null, Success(res))
const ResFail = (callback, res, code = Codes.Error) => callback(null, Fail(res, code))
const ResErr = (callback, err) => ResFail(callback, { err: err }, err.code)

async function gameLoginSign(event, context, callback){

  const [tokenErr, token] = await Model.currentToken(event)
  if (tokenErr) {
    return ResFail(callback, { ...errRes, err: tokenErr }, tokenErr.code)
  }
    //json转换
  event = event || {};
  let [parserErr, requestParams] = Util.parseJSON(event.body);
  if(parserErr) return callback(null, ResFail(callback, parserErr));
  
  //检查参数是否合法
  let [checkAttError, errorParams] = Util.checkProperties([
      {name : "gameId", type:"S", min:1}
  ], requestParams); 
  if(checkAttError){
    Object.assign(checkAttError, {params: errorParams});
    return callback(null, ResFail(callback, checkAttError));
  } 
  let timestamp = Date.now();
  requestParams.id = token.userId;
  requestParams.timestamp = timestamp;
  //找到游戏厂商的gameKey
  let gameModel = new GameModel();
  let [error, company] = await gameModel.getCompanyById(requestParams.gameId);
  if(error) {
      return ResFail(callback, error);
  }
  if(!company) {
      return ResFail(callback, BizErr.CompanyNotExistError());
  }
  let gameKey = company.companyKey;

  console.log(requestParams);
  let sign = getSign(gameKey, ["id","timestamp"], requestParams);
  ResOK(callback, {data:{sign:sign, id: token.userId, timestamp}});
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