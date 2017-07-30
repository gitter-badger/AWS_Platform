
let  athena  = require("./lib/athena");

import {CODES, CHeraErr} from "./lib/Codes";

import {ReHandler, JwtVerify} from "./lib/Response";

import {Model} from "./lib/Dynamo"


import {MerchantModel} from "./model/MerchantModel";

import {UserModel} from "./model/UserModel";

import {UserBillModel} from "./model/UserBillModel";

import {MerchantBillModel} from "./model/MerchantBillModel";

import {Util} from "./lib/Util"

import {RoleCodeEnum} from "./lib/Consts";


const ResOK = (callback, res) => callback(null, ReHandler.success(res))
const ResFail = (callback, res) => callback(null, ReHandler.fail(res))


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
    if(parserErr) return callback(null, ReHandler.fail(parserErr));
    
    const [tokenErr, token] = await Model.currentToken(event);
    if (tokenErr) {
        return ResFail(cb, tokenErr)
    }
    const [e, tokenInfo] = await JwtVerify(token[1])
    if(e) {
        return ResFail(cb, e)
    }

    let role = tokenInfo.role;
    let displayId = tokenInfo.displayId;
    let userModel = new UserModel();
    let err, userList;
    //如果是平台管理员，可以查看所有的玩家信息
    if(role == RoleCodeEnum.SuperAdmin || role == RoleCodeEnum.PlatformAdmin) {
        [err, userList] = await userModel.scan(requestParams);
    }else if(role == RoleCodeEnum.Merchant) { //如果是商家
        Object.assign(requestParams, {buId:displayId})
        [err, userList] = await userModel.scan(requestParams);
        userList.forEach(function(element) {
            delete element.userPwd
        }, this);
    }else {
        return ResOK(cb, { list: [] })
    }
    if (err) {
        return ResFail(cb, err)
    }
    return ResOK(cb, {list: userList});
}

/**
 * 玩家账单
 * @param {*} event 
 * @param {*} context 
 * @param {*} callback 
 */
export async function gamePlayerInfo(event, context, cb) {
    let userName = event.pathParameters.userName;
    let userModel = new UserModel({userName});
    let userBillModel = new UserBillModel();
    let [err, user] = await userModel.get({userName});
    if(err){
        return ResFail(cb, billError)
    }
    userInfo.merchantName = user.merchantName;
    userInfo.msn = user.msn;
    userInfo.updateAt = user.updateAt;
    userInfo.amount = user.amount;
    //获取玩家的交易记录
    let [billError, bilList] = await userBillModel.list(userName);
    if(billError) {
        return ResFail(cb, billError)
    }
    userInfo.list = bilList;
    return ResOK(cb, userInfo);
}

/**
 * 冻结/解冻玩家
 * @param {*} event 
 * @param {*} context 
 * @param {*} cb 
 */
export async function gamePlayerForzen(event, context, cb){
    //json转换
  let [parserErr, requestParams] = athena.Util.parseJSON(event.body);
  if(parserErr) {
      return ResFail(cb, parserErr);
  }
  let userName = event.pathParameters.userName;
  let state = +requestParams.state;

  var userModel = new UserModel();
  let [err] = await userModel.update({userName},{state})
  if(err) {
      return ResFail(cb, err);
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
  const [err,
    userInfo] = await JwtVerify(token[1]);
  if (err || !userInfo) {
    console.log(JSON.stringify(err), JSON.stringify(userInfo));
    return c.fail('Unauthorized')
  }

  return c.succeed(Util.generatePolicyDocument(userInfo.userId, 'Allow', e.methodArn, userInfo))

}