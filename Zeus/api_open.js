
import {Util} from "./lib/athena";

import {
  Success,
  Fail,
  Codes,
  BizErr
} from './lib/all'

import crypto from "crypto";

const ResOK = (callback, res) => callback(null, Success(res))
const ResFail = (callback, res, code = Codes.Error) => callback(null, Fail(res, code))
const ResErr = (callback, err) => ResFail(callback, { err: err }, err.code)

const SECRET = "123456";

export function gameLoginSign(event, context, callback){
    //json转换
  event = event || {};
  let [parserErr, requestParams] = Util.parseJSON(event.body);
  if(parserErr) return callback(null, ResErr(parserErr));
  //检查参数是否合法
  let [checkAttError, errorParams] = Util.checkProperties([
      {name : "userName", type:"S", min:6, max :12},
      {name : "suffix", type:"S", min:6, max :16},
      {name : "role", type:"N"},
      {name : "timestamp", type:"S", min:1},
      {name : "gameId", type:"N", equal:1}
  ], requestParams);

  let sign = getSign(["username","suffix","role","timestamp", "gameId"], requestParams);
  ResOK(callback, {sign:sign});
}

function getSign(args, msg){
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
    signValue = SECRET + signValue + SECRET;
    signValue = crypto.createHash('sha256').update(signValue).digest('hex');
    return signValue;
}