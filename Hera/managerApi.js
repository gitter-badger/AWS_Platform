
let  athena  = require("./lib/athena");

import {CODES, CHeraErr} from "./lib/Codes";

import {ReHandler, JwtVerify} from "./lib/Response";

import {Model} from "./lib/Dynamo"


import {MerchantModel} from "./model/MerchantModel";

import {UserModel, State} from "./model/UserModel";

import {UserBillModel, Type} from "./model/UserBillModel";

import {MerchantBillModel} from "./model/MerchantBillModel";

import {Util} from "./lib/Util"

import {RoleCodeEnum} from "./lib/Consts";


const ResOK = (callback, res) => callback(null, ReHandler.success(res))
const ResFail = (callback, res) => {
    let errObj = {};
    errObj.err = res;
    errObj.code = res.code;
    callback(null, ReHandler.fail(errObj))
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
    let [parserErr, requestParams] = athena.Util.parseJSON(event.queryStringParameters || {});
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
    let userModel = new UserModel();
    let err, userList=[];
    //如果是平台管理员，可以查看所有的玩家信息
    if(role == RoleCodeEnum.SuperAdmin || role == RoleCodeEnum.PlatformAdmin) {
        console.log("guangliyuan");
        [err, userList] = await userModel.scan(requestParams);
    }else if(role == RoleCodeEnum.Merchant) { //如果是商家
        requestParams = requestParams || {};
        requestParams.buId = displayId;
        [err, userList] = await userModel.scan(requestParams);
    }else if(role == RoleCodeEnum.Manager){  //如果是线路商
        console.log("这是线路商");
        //找到所有下级商户
        let merchantModel = new MerchantModel();
        let [merListErr, merchantList] = await merchantModel.agentChildListByUids([tokenInfo.userId]);
        if(merListErr) {
            return ResFail(cb, merListErr)
        }
        let merchantIds = merchantList.map((merchant) => merchant.displayId);
        console.log(merchantIds);
        if(merchantIds.length> 0) {
            [err, userList] = await userModel.findByBuIds(merchantIds);
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
    let [billError, bilList] = await userBillModel.list(userName, gameId);
    if(billError) {
        return ResFail(cb, billError)
    }
    bilList.sort((a, b) => a.createAt < b.createAt);
    user.list = bilList;
    delete user.token;
    return ResOK(cb, user);
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
  ResOK(cb, {state});
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
  ResOK(cb, {state});
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
