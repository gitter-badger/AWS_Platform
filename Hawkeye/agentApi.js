let  athena  = require("./lib/athena");

import {CODES, CHeraErr} from "./lib/Codes";

import {ReHandler, JwtVerify} from "./lib/Response";

import {MerchantModel} from "./model/MerchantModel";

import {Model} from "./lib/Dynamo"

const ResOK = (callback, res) => callback(null, ReHandler.success(res))
const ResFail = (callback, res) => {
    let errObj = {};
    errObj.err = res;
    errObj.code = res.code;
    callback(null, ReHandler.fail(errObj))
}

/**
 * 代理洗码比
 * @param {*} event 
 * @param {*} context 
 * @param {*} cb 
 */
export async function agentMix(event, context, cb) {
    const [tokenErr, token] = await Model.currentToken(event);
    if (tokenErr) {
        return ResFail(cb, tokenErr)
    }
    const [e, tokenInfo] = await JwtVerify(token[1])
    if(e) {
        return ResFail(cb, e)
    }
    let {userId} = tokenInfo;
    //获取商家信息
    const merchant = new MerchantModel();
    const [queryMerchantError, merchantInfo] = await merchant.findByUserId(userId);
    if(queryMerchantError) {
        return ResFail(cb, queryMerchantError)
    }
    if(!merchantInfo) {
        return ResFail(cb, new CHeraErr(CODES.AgentNotExist)); 
    }
    let {liveMix, vedioMix} = merchantInfo;
    ResOK(cb, {data : {
        liveMix,
        vedioMix
    }});
}