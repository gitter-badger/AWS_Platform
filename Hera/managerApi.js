
let  athena  = require("./lib/athena");

import {CODES, CHeraErr} from "./lib/Codes";

import {ReHandler, JwtVerify} from "./lib/Response";

import {Model} from "./lib/Dynamo"


import {MerchantModel} from "./model/MerchantModel";

import {LogModel} from "./model/LogModel";

import {UserModel, State} from "./model/UserModel";

import {UserBillModel, Type} from "./model/UserBillModel";

import {MerchantBillModel} from "./model/MerchantBillModel";

import {Util} from "./lib/Util"

import {RoleCodeEnum} from "./lib/Consts";

import { TokenModel } from './model/TokenModel'


const ResOK = (callback, res) => callback(null, ReHandler.success(res))
const ResFail = (callback, res) => {
    let errObj = {};
    errObj.err = res;
    errObj.code = res.code;
    callback(null, ReHandler.fail(errObj))
}

function validateIp(event, merchant) {
  return true;
  let loginWhiteStr = merchant.loginWhiteList;
  let whiteList = loginWhiteStr.split(";");
  whiteList.forEach(function(element) {
    element.trim();
  }, this);
  console.log("event.headers.identity");
  console.log(event.requestContext.identity);
  console.log(whiteList);
  let sourceIp = event.requestContext.identity.sourceIp;
  let allIp = whiteList.find((ip) => ip == "0.0.0.0");
  let whiteIp = whiteList.find((ip) => ip == sourceIp);
  if(whiteIp || allIp) return true;
  return false;
}

const logEnum = {
  "jiesuo" : {
    type :"operate",
    action : "玩家解锁",
    detail : "成功",
  },
  "suoding" : {
    type :"operate",
    action : "玩家锁定",
    detail : "成功",
  }
}

/**
 * 错误处理
 * @param {*} callback 
 * @param {*} error 
 */
async function errorHandler(callback, error, type, merchantInfo, userInfo) {
  ResFail(callback, error);
  //写日志
  delete userInfo.userId;
  delete userInfo.role;
  Object.assign(merchantInfo, {
    ...userInfo,
    ...logEnum[type],
    detail : error.msg,
    ret : "N"
  })
  let logModel = new LogModel(merchantInfo);
  console.log(logModel);
  let [sErr] = await logModel.save();
}

/**
 * 成功处理
 * @param {*} callback 
 * @param {*} data 
 */
async function successHandler(callback, data, type, merchantInfo, userInfo) {
  ResOK(callback, data);
  //写日志
  delete userInfo.userId;
  delete userInfo.role;
  Object.assign(merchantInfo, {
    ...userInfo,
    ...logEnum[type],
    ret : "Y"
  })
  let logModel = new LogModel(merchantInfo);
  let [sErr] = await logModel.save();
}
/**
 * 玩家列表
 * @param {*} event 
 * @param {*} context 
 * @param {*} cb 
 */
export async function gamePlayerList(event, context, cb) {
    console.log(event);
    //json转换
    let date = Date.now();
    console.log("请求开始:"+date);
    let [parserErr, requestParams] = athena.Util.parseJSON(event.body || {});
    if(parserErr) return cb(null, ReHandler.fail(parserErr));
    const [tokenErr, token] = await Model.currentToken(event);
    if (tokenErr) {
        return ResFail(cb, tokenErr)
    }
    const [e, tokenInfo] = await JwtVerify(token[1])
    if(e) {
        return ResFail(cb, e)
    }
    let role = tokenInfo.role;
    let displayId = +tokenInfo.displayId;
    let sortKey = requestParams.sortKey || "createAt";
    let sortMode = requestParams.sortKey || "dsc";  //asc 升序  dsc 降序
    let userModel = new UserModel();
    let err, userList=[];
    console.log(requestParams);
    //如果是平台管理员，可以查看所有的玩家信息
    if(role == RoleCodeEnum.SuperAdmin || role == RoleCodeEnum.PlatformAdmin) {
        console.log("guangliyuan");
        [err, userList] = await userModel.playerList(requestParams);
        console.log("查询结束:"+Date.now());
    }else if(role == RoleCodeEnum.Merchant) { //如果是商家
        console.log("这是商户");
        requestParams = requestParams || {};
        requestParams.buId = displayId;
        [err, userList] = await userModel.playerList(requestParams);
    }else if(role == RoleCodeEnum.Manager){  //如果是线路商
        console.log("这是线路商");
        //找到所有下级商户
        let merchantModel = new MerchantModel();
        let [merListErr, merchantList] = await merchantModel.agentChildListByUids([tokenInfo.userId]);
        if(merListErr) {
            return ResFail(cb, merListErr)
        }
        let merchantIds = merchantList.map((merchant) => merchant.displayId);
        if(merchantIds.length> 0) {
            [err, userList] = await userModel.findByBuIds(merchantIds, requestParams);
        }
    }else {
        return ResOK(cb, { list: [] })
    }
    if (err) {
        return ResFail(cb, err)
    }
    for(let i = 0; i < userList.length; i++) {
        let element = userList[i];
        if(element.msn == "000") {
            userList.splice(i, 1);
            i --;
        }
    }
    userList = userList || [];
    userList.forEach(function(element) {
            delete element.userPwd
    }, this);
    for(let i = 0; i < userList.length; i++) {
        for(let j = i+1; j < userList.length;j++) {
            if(isSort(userList[i], userList[j])){
                let item = userList[i];
                userList[i] = userList[j];
                userList[j] = item;
            }
        }
    }
    function isSort(a, b){
        return sortMode == "asc" ? a[sortKey] > b[sortKey] : a[sortKey] < b[sortKey]
    }
    
    ResOK(cb, {list: userList});
}

/**
 * 玩家账单
 * @param {*} event 
 * @param {*} context 
 * @param {*} callback 
 */
export async function gamePlayerInfo(event, context, cb) {

    const [tokenErr, token] = await Model.currentToken(event);
    if (tokenErr) {
        return ResFail(cb, tokenErr)
    }
    const [e, tokenInfo] = await JwtVerify(token[1])
    if(e) {
        return ResFail(cb, e)
    }

    let [parserErr, requestParams] = athena.Util.parseJSON(event.queryStringParameters || {});
    if(parserErr) {
        return ResFail(cb, parserErr);
    }
     //检查参数是否合法
    let [checkAttError, errorParams] = athena.Util.checkProperties([
        {name : "userName", type:"S"},
    ], requestParams);
    if(checkAttError){
        Object.assign(checkAttError, {params: errorParams});
        return cb(null, ReHandler.fail(checkAttError));
    } 
    let userName = requestParams.userName;
    let gameId = requestParams.gameId;
    let userModel = new UserModel({userName});
    let userBillModel = new UserBillModel();
    let [err, user] = await userModel.get({userName});
    if(err){
        return ResFail(cb, err)
    }
    if(!user) {
        return ResFail(cb, new CHeraErr(CODES.userNotExist));
    }
    //获取玩家的交易记录
    let [billError, billList] = await userBillModel.list(userName, gameId);
    if(billError) {
        return ResFail(cb, billError)
    }
    // billList = billList.sort((a, b) => {
    //     return +a.createAt - +b.createAt > 0
    // });
    sort(billList);
    user.list = billList;

    delete user.token;
    return ResOK(cb, user);
}

function sort(array) {
    for(let i = 0; i <array.length; i ++) {
        for(let j = i+1; j <array.length; j ++) {
            if(array[j].createAt > array[i].createAt) {
                let item = array[j];
                array[j] = array[i];
                array[i] = item;
            }
        }
        delete array[i].seatInfo;
    }
}

/**
 * 冻结/解冻玩家
 * @param {*} event 
 * @param {*} context 
 * @param {*} cb 
 */
export async function gamePlayerForzen(event, context, cb){
    console.log(event);
  const [tokenErr, token] = await Model.currentToken(event);
  if (tokenErr) {
    return ResFail(cb, tokenErr)
  }
  const [e, tokenInfo] = await JwtVerify(token[1])
  if(e) {
    return ResFail(cb, e)
  }
    //json转换
  let [parserErr, requestParams] = athena.Util.parseJSON(event.body);
  if(parserErr) {
      return ResFail(cb, parserErr);
  }
   //检查参数是否合法
  let [checkAttError, errorParams] = athena.Util.checkProperties([
      {name : "state", type:"N"},
      {name : "userName", type:"S"},
  ], requestParams);
  if(checkAttError){
    Object.assign(checkAttError, {params: errorParams});
    return cb(null, ReHandler.fail(checkAttError));
  } 
  let userName = requestParams.userName;
  let state = +requestParams.state;
  if(state != State.forzen && state != State.normal) {
      let stateError = new CHeraErr(CODES.DataError);
      Object.assign(stateError, {params: ["state"]});
      return ResFail(cb, stateError);
  }
  var userModel = new UserModel();
  let [getUserRrror, us] = await userModel.get({userName});
  if(getUserRrror || !us) {
    return ResOK(cb, {state});
  }
  let [err] = await userModel.update({userName},{state})
  if(err) {
      return ResFail(cb, err);
  }
  let type = state == State.normal ?  "jiesuo" : "suoding";
  successHandler(cb, {state}, type, tokenInfo, us);
//   ResOK(cb, {state});
}

/**
 * 批量冻结/解冻玩家
 * @param {*} event 
 * @param {*} context 
 * @param {*} cb 
 */
export async function batchForzen(event, context, cb){

  const [tokenErr, token] = await Model.currentToken(event);
  if (tokenErr) {
    return ResFail(cb, tokenErr)
  }
  const [e, tokenInfo] = await JwtVerify(token[1])
  if(e) {
    return ResFail(cb, e)
  }
  //json转换
  console.log(event.body);
  let [parserErr, requestParams] = athena.Util.parseJSON(event.body);
  if(parserErr) {
      return ResFail(cb, parserErr);
  }
  //检查参数是否合法
  let [checkAttError, errorParams] = athena.Util.checkProperties([
      {name : "state", type:"N"},
      {name : "names", type:"J"},
  ], requestParams);
  
  if(checkAttError){
    Object.assign(checkAttError, {params: errorParams});
    return cb(null, ReHandler.fail(checkAttError));
  } 
  let names = requestParams.names;
  let state = +requestParams.state;
  for(let i = 0; i < names.length; i++){
    let userName = names[i];
    let userModel = new UserModel();
    let [getUserRrror, us] = await userModel.get({userName});
    if(getUserRrror || !us) continue;
    let [err] = await userModel.update({userName},{state})
    if(err) {
      return ResFail(cb, err);
    }
  }
  let type = state == State.normal ?  "jiesuo" : "suoding";
  successHandler(cb, {state}, type, tokenInfo, {});
//   ResOK(cb, {state});
}

// export async function page(event, context, cb){
//     let [err, page] = await new UserModel().page({userName:{"$like":"AWJ"}},2, 2, "userName","asc");
//     console.log(err);
//     console.log(page);
// }
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
