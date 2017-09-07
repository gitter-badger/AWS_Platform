
let  athena  = require("./lib/athena");

import {CODES, CHeraErr} from "./lib/Codes";

import {ReHandler, JwtVerify} from "./lib/Response";

import {Model} from "./lib/Dynamo"


import {MerchantModel} from "./model/MerchantModel";

import {UserModel, State} from "./model/UserModel";

import {UserBillModel, Type} from "./model/UserBillModel";

import {Util} from "./lib/Util"

import {RoleCodeEnum} from "./lib/Consts";


const ResOK = (callback, res) => callback(null, ReHandler.success(res))
const ResFail = (callback, res) => {
    let errObj = {};
    errObj.err = res;
    errObj.code = res.code;
    callback(null, ReHandler.fail(errObj))
}

const playerList = async (event,  context, cb) => {
    console.log(event);
    //json转换
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
    //检查参数是否合法
    let [checkAttError, errorParams] = athena.Util.checkProperties([
        {name : "userId", type:"S"},
    ], requestParams);
    if(checkAttError){
        Object.assign(checkAttError, {params: errorParams});
        return ResFail(cb, checkAttError);
    }
    let {userId} = requestParams;
    let [parentErr, parentInfo] = await new MerchantModel().findByUserId(userId);
    if(parentErr) {
        return ResFail(cb, parentErr);
    }
    if(!parentInfo) {
        return ResFail(cb, new CHeraErr(CODES.userNotExist));
    }
    let displayId = parentInfo.displayId;
    let playerModel = new UserModel({});
    let [palyerListErr, playerList] = await playerModel.scan({buId:displayId});
    if(palyerListErr) {
        return ResFail(cb, new CHeraErr(CODES.palyerListErr));
    }
    let returnArr = playerList.map((item) => {
        let name =item.userName;
        if(parentInfo.suffix) {
            name = `【${parentInfo.suffix}】` + item.userName.split("_")[1];
        }
        return {
            userId: item.userId,
            userName : item.userName,
            nickname : item.nickname,
            role : item.role,
            name
        }
    })
    ResOK(cb, {list:returnArr})
}
export{
    playerList
}