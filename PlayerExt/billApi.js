
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
  let sortKey = requestParams.sortKey || "createdAt";
  let sortMode = requestParams.sort || "desc";  //asce 升序  desc 降序
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
    list[i] = buildObj(item);
    if(item.type == 21 || item.type ==1 || item.type==2) {
      list.splice(i, 1);
      i --;
    }
  }
  for(let i = 0; i < list.length; i++) {
      for(let j = i+1; j < list.length;j++) {
          if(isSort(list[i], list[j])){
              let item = list[i];
              list[i] = list[j];
              list[j] = item;
          }
      }
  }
  function isSort(a, b){
      return sortMode == "asce" ? a[sortKey] > b[sortKey] : a[sortKey] < b[sortKey]
  }
  function buildObj(item) {
    return {
      sn : item.sn,
      createdAt : item.createdAt,
      type : item.type,
      billId : item.billId,
      businessKey : item.businessKey || "",
      originalAmount : item.originalAmount || 0,
      balance : item.balance || "",
      amount : item.amount
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
  console.log(event);
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
  let sortKey = requestParams.sortKey || "createdAt";
  let sortMode = requestParams.sort || "desc";  //asce 升序  desc 降序
  let {billId} = requestParams;
  let billDetail = new UserBillDetailModel();
  let [detailErr, list] = await billDetail.billDetail(billId);
  if(detailErr) {
    return cb(null, ReHandler.fail(detailErr));
  }
  //洗马量和argPTR没有写
  let sumAmount = 0, reSumAmount= 0, depSumAmount =0,mixNum=0;
  //根据billId查询账单
  let billModel = new UserBillModel();
  let [billInfoErr, billInfo] = await billModel.get({billId}, ["userName","billId","joinTime","createAt","amount","mixAmount","betAmount","reAmount"], "billIdIndex");
  if(billInfoErr) {
    return cb(null, ReHandler.fail(billInfoErr));
  }
  
  if(!billInfo) {
    return cb(null, ReHandler.fail(new CHeraErr(CODES.billNotExist)));
  }

  if(billInfo.betAmount && billInfo.reAmount) {
    depSumAmount = +(billInfo.reAmount - Math.abs(billInfo.betAmount)).toFixed(2);
    for(let i = 0; i < list.length; i++) {
        let item = list[i];
        if(item.type >=1 && item.type<=5) {
          list.splice(i, 1);
          i --;
        }
      }
  }else {
    for(let i = 0; i < list.length; i++) {
      let item = list[i];
      item.joinTime = item.createdAt;
      if(item.type >=1 && item.type<=5) {
        list.splice(i, 1);
        i --;
      }else {
        sumAmount += Math.abs(item.amount);
        reSumAmount += item.reAmount || 0;
      }
    }
    depSumAmount = -sumAmount + reSumAmount;
  }
  billInfo = buildBillInfo();
  function buildBillInfo(){
    return {
      billId: billInfo.billId,  //账单ID
      userName : billInfo.userName,  //用户名
      joinTime : billInfo.joinTime || 0,  //进入时间
      createdAt : billInfo.createAt,   //退出时间（结算时间）
      avgRTP : Math.abs(+reSumAmount/(sumAmount).toFixed(2)),  //净利润/总投注数
      sumAmount : -billInfo.betAmount || sumAmount , //下注总额
      reSumAmount : billInfo.reAmount || reSumAmount, //返还金额
      depSumAmount, //利润总额
      mixNum :billInfo.mixAmount || sumAmount  //洗马量
    }
  }
  for(let i = 0; i < list.length; i++) {
      for(let j = i+1; j < list.length;j++) {
          if(isSort(list[i], list[j])){
              let item = list[i];
              list[i] = list[j];
              list[j] = item;
          }
      }
  }
  function isSort(a, b){
      return sortMode == "asce" ? a[sortKey] > b[sortKey] : a[sortKey] < b[sortKey]
  }
  let returnArr = list.map((item) => {
    return {
      sn : item.sn,
      createdAt : item.createdAt,
      originalAmount : item.originalAmount,  //账前余额
      amount : item.amount,   //下注金额
      rate : item.rate || null, //成数
      balance : item.balance,  //结算金额
      mix : (item.mix == -1 || !item.mix)? 0 : item.mix,  //洗马比
      reAmount : item.reAmount || 0,  //返还金额
      deAmount : (item.amount + item.reAmount || 0),  //净利
      balance : item.balance || null,   //返还后余额
      businessKey : item.businessKey || ''  //betId
    }
  })
  let obj = {
    billInfo,
    list : returnArr
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
  if(recordInfo) {
    let betTime = recordInfo.betTime;
    let [recordListErr, recordList] = await new UserRecordModel().findByBetTime(userName, betTime);
    if(recordListErr) {
      return cb(null, ReHandler.fail(recordListErr));
    }
    recordInfo.record = recordInfo.record || {}
    recordInfo.record.betNum = "";
    for(let i = 0; i < recordList.length; i++){
      let item = recordList[i].record;
      recordInfo.record.betNum += item.itemName+"($"+item.amount+")，"
    }
    recordInfo.record.betNum = recordInfo.record.betNum.substring(0, recordInfo.record.betNum.length-1);
  }
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