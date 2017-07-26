
let  athena  = require("./lib/athena");

import {CODES, CHeraErr} from "./lib/Codes";

import {ReHandler} from "./lib/Response";

import {Model} from "./lib/Dynamo"


import {MerchantModel} from "./model/MerchantModel";

import {UserModel} from "./model/UserModel";

import {UserBillModel} from "./model/UserBillModel";

import {MerchantBillModel} from "./model/MerchantBillModel";

import {Util} from "./lib/Util"

import {RoleCodeEnum} from "./lib/Consts";


const ResOK = (callback, res) => callback(null, ReHandler.success(res))
const ResFail = (callback, res) => callback(null, ReHandler.fail(res, code))


/**
 * 玩家列表
 * @param {*} event 
 * @param {*} context 
 * @param {*} cb 
 */
export async function gamePlayerList(event, context, cb) {
    const [tokenErr, token] = await Model.currentToken(event)
    if (tokenErr) {
        return ResErr(cb, tokenErr)
    }
    let role = token.role;
    let displayId = token.displayId;
    let userModel = new UserModel();
    let err, userList;
    //如果是平台管理员，可以查看所有的玩家信息
    if(role == RoleCodeEnum.SuperAdmin || role == RoleCodeEnum.PlatformAdmin) {
        [err, userList] = await userModel.list();
    }else if(role == RoleCodeEnum.Merchant) { //如果是商家
        [err, userList] = await userModel.list(displayId);
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
    let userInfo = {billList:[]};
    let userModel = new UserModel({userName});
    let userBillModel = new UserBillModel();
    let [err, user] = await userModel.get({userName});
    if(err){
        return ResFail(cb, billError)
    }
    console.log(user);
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


