
let  athena  = require("./lib/athena");

import {CODES, CHeraErr} from "./lib/Codes";

import {ReHandler, JwtVerify} from "./lib/Response";

import {Model} from "./lib/Dynamo"

import {UserBillDetailModel} from "./model/UserBillDetailModel"

import {UserBillModel} from "./model/UserBillModel"

import {Util} from "./lib/Util"

import {TokenModel} from "./model/TokenModel"

import {UserRecordModel} from "./model/UserRecordModel"

const ResOK = (callback, res) => callback(null, ReHandler.success(res))
const ResFail = (callback, res) => {
    let errObj = {};
    errObj.err = res;
    errObj.code = res.code;
    callback(null, ReHandler.fail(errObj))
}

/**
 * 账单流水
 * @param {*} e 
 * @param {*} c 
 * @param {*} cb 
 */
const billFlow = async(event, context, cb) => {
  const [tokenErr, token] = await Model.currentToken(event);
  if (tokenErr) {
    return ResFail(cb, tokenErr)
  }
  const [e, tokenInfo] = await JwtVerify(token[1])
  if(e) {
    return ResFail(cb, e)
  }
   //检查参数是否合法
  console.log(event.body);
  let [parserErr, requestParams] = athena.Util.parseJSON(event.body);
  if(parserErr) {
      return ResFail(cb, parserErr);
  }
  let [checkAttError, errorParams] = athena.Util.checkProperties([
      {name : "userName", type:"S"}
  ], requestParams);
  if(checkAttError){
      Object.assign(checkAttError, {params: errorParams});
      return cb(null, ReHandler.fail(checkAttError));
  }

  let {userName,startTime, endTime, type, action} = requestParams;
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
  let [detailErr, list] = await billDetail.billFlow(userName, startTime, endTime, type, action);
  if(detailErr) {
    return cb(null, ReHandler.fail(detailErr));
  }
  for(let i = 0; i < list.length; i++) {
    let item = list[i];
    if(item.type == 21) {
      list.splice(i, 1);
      i --;
    }
  }
  ResOK(cb, {list:list});
}
/**
 * 账单明细
 * @param {*} e 
 * @param {*} c 
 * @param {*} cb 
 */
const billDetail = async(event, context, cb) => {
  const [tokenErr, token] = await Model.currentToken(event);
  if (tokenErr) {
    return ResFail(cb, tokenErr)
  }
  const [e, tokenInfo] = await JwtVerify(token[1])
  if(e) {
    return ResFail(cb, e)
  }
  let [parserErr, requestParams] = athena.Util.parseJSON(event.body);
  if(parserErr) {
      return ResFail(cb, parserErr);
  }
  let [checkAttError, errorParams] = athena.Util.checkProperties([
      {name : "billId", type:"S"},
  ], requestParams);
  if(checkAttError){
      Object.assign(checkAttError, {params: errorParams});
      return cb(null, ReHandler.fail(checkAttError));
  }
  let {billId} = requestParams;
  let billDetail = new UserBillDetailModel();
  let [detailErr, list] = await billDetail.billDetail(billId);
  console.log(list);
  if(detailErr) {
    console.log("11111111111111");
    return cb(null, ReHandler.fail(detailErr));
  }
  //洗马量和argPTR没有写
  let sumAmount = 0, reSumAmount= 0, depSumAmount =0,mixNum=0;
  for(let i = 0; i < list.length; i++) {
    let item = list[i];
    item.joinTime = item.createdAt;
    if(item.type >=1 && item.type<=4) {
      list.splice(i, 1);
      i --;
    }else {
      sumAmount += item.amount;
      reSumAmount += item.reAmount || 0;
    }
  }
  depSumAmount = sumAmount + reSumAmount;
  //根据billId查询账单
  let billModel = new UserBillModel();
  let [billInfoErr, billInfo] = await billModel.get({billId}, ["userName","billId","joinTime","createAt"], "billIdIndex");
  if(billInfoErr) {
    return cb(null, ReHandler.fail(billInfoErr));
  }
  if(!billInfo) {
    return cb(null, ReHandler.fail(CODES.billNotExist));
  }
  Object.assign(billInfo, {
    reSumAmount,
    sumAmount,
    depSumAmount,
    mix
  })
  let obj = {
    billInfo,
    list
  }
  ResOK(cb, obj);
}

/**
 * 账单流水战绩
 * @param {*} e 
 * @param {*} c 
 * @param {*} cb 
 */
const billGameRecord = async(event, context, cb) => {
  const [tokenErr, token] = await Model.currentToken(event);
  if (tokenErr) {
    return ResFail(cb, tokenErr)
  }
  const [e, tokenInfo] = await JwtVerify(token[1])
  if(e) {
    return ResFail(cb, e)
  }

  let [parserErr, requestParams] = athena.Util.parseJSON(event.body);
  if(parserErr) {
      return ResFail(cb, parserErr);
  }
  let [checkAttError, errorParams] = athena.Util.checkProperties([
      {name : "userName", type:"S"},
      {name : "betId", type:"S"},
  ], requestParams);
  if(checkAttError){
      Object.assign(checkAttError, {params: errorParams});
      return cb(null, ReHandler.fail(checkAttError));
  }
  let {userName, betId} = requestParams;
  let [recordErr, recordInfo] = await new UserRecordModel().get({userName, betId});
  if(recordErr) {
    return cb(null, ReHandler.fail(recordErr));
  }
  recordInfo =recordInfo || null;
  ResOK(cb, {data:recordInfo});
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
  billFlow,
  billDetail,
  billGameRecord
}