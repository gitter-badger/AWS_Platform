
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
 * 代理玩家列表
 * @param {*} event 
 * @param {*} context 
 * @param {*} cb 
 */
export async function agentPlayerList(event, context, cb) {
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
    let err, userList;
    //如果是平台管理员，可以查看所有的玩家信息

    if(role == RoleCodeEnum.Agent) {
        //找到所有下级
        let [childrenError, childrenList] = new MerchantModel().agentChildListByUids([tokenInfo.userId]);
        let buIds = childrenList.map((item) => +tem.displayId);
        uids.push(+displayId);
        let userModel = new UserModel();
        //找到代理所有用户
        userModel.findByBuIds(buIds);
        [err, userList] = await userModel.scan(requestParams);
    }else {
        return ResOK(cb, { list: [] })
    }
    if (err) {
        return ResFail(cb, err)
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
        return ResFail(cb, billError)
    }
    if(!user) {
        return ResFail(cb, new CHeraErr(CODES.userNotExist));
    }
    //获取玩家的交易记录
    let [billError, bilList] = await userBillModel.list(userName, gameId);
    if(billError) {
        return ResFail(cb, billError)
    }
    user.list = bilList;
    delete user.token;
    return ResOK(cb, user);
}


/**
 * 创建玩家
 * @param {*} event 
 * @param {*} context 
 * @param {*} cb 
 */
export async function createPlayer(event, context, cb) {
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
        {name : "userName", type:"S", min:6, max:12},
        {name : "userPwd", type:"S", min:6, max :16},
        {name : "nickname", type:"S", min:3, max :16},
        {name : "points", type:"N"},
        {name : "remark", type:"S", min:1, max:200},
    ], requestParams);
    //创建者信息
    let {userId,username} = tokenInfo;
    //获取商家信息
    const merchant = new MerchantModel();
    const [queryMerchantError, merchantInfo] = await merchant.findByUserId(userId);

    if(queryMerchantError) {
        return ResFail(cb, queryMerchantError); 
    }
    if(!merchantInfo) {
        return ResFail(cb, new CHeraErr(CODES.AgentNotExist)); 
    }
    if(merchantInfo.role != RoleCodeEnum.Agent) {
        return ResFail(cb, new CHeraErr(CODES.NotAuth)); 
    }
    let {suffix, msn} = merchantInfo;
    //实际的用户名
    let userName = `${suffix}_${requestParams.userName}`;

    let userModel = new UserModel({
        ...requestParams,
        buId : merchantInfo.displayId,
    });
    let [existError, flag] = await user.isExist(userName);
    if(existError) return ResFail(cb, existError);
    //用户已经注册
    if(flag) return ResFail(cb, new CHeraErr(CODES.userAlreadyRegister));
    //生成密码hash
    userModel.cryptoPassword();
    
    //代理余额
    let [agentBError, agentBalance] = await new MerchantBillModel({userId}).getBlance();
    if(agentBError)return ResFail(cb, agentBError);
    if(agentBalance < requestParams.points) {
        return ResFail(cb, new CHeraErr(CODES.AgentBalanceIns));
    }
    //保存玩家
    let [userSaveError, userInfo] = await userModel.save();
    if(userSaveError) return ResFail(cb, userSaveError);
    //玩家账单
    let baseBillModel = {
      fromRole : RoleCodeEnum.Agent,
      toRole : RoleCodeEnum.Player,
      fromUser : username,
      toUser : userName,
      msn : msn,
      amount : +requestParams.points,
      operator : username,
      remark : requestParams.remark,
      gameType : -1,
      typeName : "代理存点"
    }
    let userBillModel = new UserBillModel({
        ...baseBillModel,
        action : 1,
        kindId : -2,
        userId : userInfo.userId,
        userName : userName,
        type : Type.agentOper
    });
    let [savePlayerError] = await userBillModel.save();
    if(savePlayerError) return ResFail(cb, savePlayerError);
    //商户点数变化
    let merchantBillModel = new MerchantBillModel({
        ...baseBillModel,
        action : -1,
        userId :merchantInfo.userId,
        username : merchantInfo.username,
    });
    let [mError, amount] = await merchantBillModel.save();
    if(mError) return callback(null, ReHandler.fail(mError));
    ResOK(cb, {data : userInfo});
}

/**
 * @param {*} event 
 * @param {*} context 
 * @param {*} cb 
 */
export async function agentPlayerInfo(event, context, cb) {
    //json转换
    console.log(event.body);
    let [parserErr, requestParams] = athena.Util.parseJSON(event.body);
    if(parserErr) {
        return ResFail(cb, parserErr);
    }
    //检查参数是否合法
    let [checkAttError, errorParams] = athena.Util.checkProperties([
        {name : "userName", type:"S", min:6, max:12},
    ], requestParams);
    let {userId} = requestParams;
    let userModel = new UserModel();
    let [getError, userInfo] = await userModel.get({userName});
    if(getError) {
        return ResFail(cb, getError);
    }
    userInfo = userInfo || {};
    ResOK(cb, {data : {
        userName : userInfo.userName,
        password : userInfo.password,
        updateAt : userInfo.updateAt
    }});
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
