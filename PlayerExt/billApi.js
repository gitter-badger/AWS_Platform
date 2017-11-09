
let  athena  = require("./lib/athena");

import {CODES, CHeraErr} from "./lib/Codes";

import {ReHandler, JwtVerify} from "./lib/Response";

import {Model} from "./lib/Dynamo"

import {UserBillDetailModel} from "./model/UserBillDetailModel"

const ResOK = (callback, res) => callback(null, ReHandler.success(res))
const ResFail = (callback, res) => {
    let errObj = {};
    errObj.err = res;
    errObj.code = res.code;
    callback(null, ReHandler.fail(errObj))
}

const billFlow = async(e, c, cb) => {
  const [tokenErr, token] = await Model.currentToken(event);
  if (tokenErr) {
    return ResFail(cb, tokenErr)
  }
  const [e, tokenInfo] = await JwtVerify(token[1])
  if(e) {
    return ResFail(cb, e)
  }
   //检查参数是否合法
  let [checkAttError, errorParams] = athena.Util.checkProperties([
      {name : "userName", type:"S"},
  ], requestParams);
  if(checkAttError){
      Object.assign(checkAttError, {params: errorParams});
      return cb(null, ReHandler.fail(checkAttError));
  }
  let {userName,startTime, endTime} = requestParams;
  if(!startTime) {
    startTime = 0;
  }
  if(!endTime) {
    endTime = Date.now();
  }
  if(startTime > endTime) {
    startTime = endTime;
  }
  let billDetail = new UserBillDetailModel();
  let queryParamsStr = billDetail.buildQueryParams();
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
  } else {
    // 结果返回
    return c.succeed(Util.generatePolicyDocument(userInfo.userId, 'Allow', e.methodArn, userInfo))
  }
//   return c.succeed(Util.generatePolicyDocument(userInfo.userId, 'Allow', e.methodArn, userInfo))
}

export{
  billFlow
}