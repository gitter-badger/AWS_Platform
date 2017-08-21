
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
        let [childrenError, childrenList] = await new MerchantModel().agentChildListByUids([tokenInfo.userId]);
        if(childrenError) return ResFail(cb, childrenError)
        let buIds = childrenList.map((item) => +item.displayId);
        buIds.push(+displayId);
        let userModel = new UserModel();
        //找到代理所有用户
        [err, userList] = await userModel.findByBuIds(buIds);
    }else {
        return ResOK(cb, { list: []})
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
 * 玩家存点
 * @param {*} event 
 * @param {*} context 
 * @param {*} cb 
 */
export async function agentPlayerCudian(event, context, cb){
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
        {name : "userName", type:"S"},
        {name : "points", type:"N",min:1},
    ], requestParams);
    if(checkAttError){
        Object.assign(checkAttError, {params: errorParams});
        return cb(null, ReHandler.fail(checkAttError));
    } 
    let [userErr, userInfo] = await new UserModel().get({userName:requestParams.userName});
    if(userErr) {
        return ResFail(cb, userErr)
    }
    if(!userInfo) {
        return ResFail(cb, new CHeraErr(CODES.userNotExist));
    }
    const [queryMerchantError, merchantInfo] = await new MerchantModel().findByUserId(tokenInfo.userId);

    if(queryMerchantError) {
        return ResFail(cb, queryMerchantError); 
    }
    if(!merchantInfo) {
        return ResFail(cb, new CHeraErr(CODES.AgentNotExist)); 
    }
    let [cudianErr] = await cudian(userInfo, merchantInfo, requestParams);
    if(cudianErr) {
        return ResFail(cb, cudianErr);
    }
    let [userBErr, points] = await new UserBillModel({userName:userInfo.userName}).getBalance();
    if(userBErr) {
        return ResFail(cb, cudianErr);
    }
    ResOK(cb, {data:{points}});
}

/**
 * 玩家取点
 * @param {*} event 
 * @param {*} context 
 * @param {*} cb 
 */
export async function agentPlayerQudian(event, context, cb){
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
        {name : "userName", type:"S"},
        {name : "points", type:"N",min:1},
    ], requestParams);
    if(checkAttError){
        Object.assign(checkAttError, {params: errorParams});
        return cb(null, ReHandler.fail(checkAttError));
    } 
    let [userErr, userInfo] = await new UserModel().get({userName:requestParams.userName});
    if(userErr) {
        return ResFail(cb, userErr)
    }
    if(!userInfo) {
        return ResFail(cb, new CHeraErr(CODES.userNotExist));
    }
    const [queryMerchantError, merchantInfo] = await new MerchantModel().findByUserId(tokenInfo.userId);

    if(queryMerchantError) {
        return ResFail(cb, queryMerchantError); 
    }
    if(!merchantInfo) {
        return ResFail(cb, new CHeraErr(CODES.AgentNotExist)); 
    }
    let [cudianErr] = await qudian(userInfo, merchantInfo, requestParams);
    if(cudianErr) {
        return ResFail(cb, cudianErr);
    }
    let [userBErr, points] = await new UserBillModel({userName:userInfo.userName}).getBalance();
    if(userBErr) {
        return ResFail(cb, cudianErr);
    }
    ResOK(cb, {data:{points}});
}

async function qudian(userInfo, merchantInfo, requestParams) {
    //玩家余额
    let [playerBError, playerBalance] = await new UserBillModel({userName:userInfo.userName}).getBalance();
    if(playerBError)return ResFail(cb, agentBError);
    if(playerBalance < requestParams.points) {
        return [new CHeraErr(CODES.AgentBalanceIns), null];
    }
    //玩家账单
    let baseBillModel = {
      fromRole : RoleCodeEnum.Agent,
      toRole : RoleCodeEnum.Player,
      fromUser : merchantInfo.username,
      toUser : userInfo.userName,
      msn : "000",
      amount : +requestParams.points,
      operator : merchantInfo.username,
      remark : requestParams.remark,
      gameType : -1,
      typeName : "代理取点"
    }
    let userBillModel = new UserBillModel({
        ...baseBillModel,
        action : -1,
        kindId : -2,
        userId : userInfo.userId,
        originalAmount : playerBalance,
        userName : userInfo.userName,
        type : Type.agentOper
    });
    let [savePlayerError] = await userBillModel.save();
    if(savePlayerError) return [savePlayerError, null]
    //商户点数变化
    let merchantBillModel = new MerchantBillModel({
        ...baseBillModel,
        action : 1,
        userId :merchantInfo.userId,
        username : merchantInfo.username,
    });
    let [mError] = await merchantBillModel.save();

    //更新玩家余额
    //查账
    let [getError, userSumAmount] = await userBillModel.getBalance();
    if(getError) return [getError,null]
    //更新余额
    console.log("用户余额");
    console.log(userSumAmount);
    let [updateError] = await new UserModel().update({userName:userInfo.userName},{balance : userSumAmount});
    if(updateError) return [updateError,null]
    return [null, null];
}
/**
 * 玩家存点
 * @param {*} event 
 * @param {*} context 
 * @param {*} cb 
 */
async function cudian(userInfo, merchantInfo, requestParams){
    //玩家余额
    let [playerBError, playerBalance] = await new UserBillModel({userName:userInfo.userName}).getBalance();
    if(playerBError)return ResFail(cb, agentBError);
    if(playerBalance < requestParams.points) {
        return [new CHeraErr(CODES.AgentBalanceIns), null];
    }
    //代理余额
    let [agentBError, agentBalance] = await new MerchantBillModel({userId:merchantInfo.userId}).getBlance();
    agentBalance += +merchantInfo.points;  //需要加上初始点数
    console.log("商家点数");
    console.log(agentBalance);
    if(agentBError)return ResFail(cb, agentBError);
    if(agentBalance < requestParams.points) {
        return [new CHeraErr(CODES.AgentBalanceIns), null];
    }
    //玩家账单
    let baseBillModel = {
      fromRole : RoleCodeEnum.Agent,
      toRole : RoleCodeEnum.Player,
      fromUser : merchantInfo.username,
      toUser : userInfo.userName,
      msn : "000",
      amount : +requestParams.points,
      operator : merchantInfo.username,
      remark : requestParams.remark,
      gameType : -1,
      typeName : "代理存点"
    }
    let userBillModel = new UserBillModel({
        ...baseBillModel,
        action : 1,
        kindId : -2,
        userId : userInfo.userId,
        userName : userInfo.userName,
        originalAmount : playerBalance,
        type : Type.agentOper
    });
    let [savePlayerError] = await userBillModel.save();
    if(savePlayerError) return [savePlayerError, null]
    //商户点数变化
    let merchantBillModel = new MerchantBillModel({
        ...baseBillModel,
        action : -1,
        userId :merchantInfo.userId,
        username : merchantInfo.username,
    });
    let [mError] = await merchantBillModel.save();

    //更新玩家余额
    //查账
    let [getError, userSumAmount] = await userBillModel.getBalance();
    if(getError) return [getError,null]
    //更新余额
    console.log("用户余额");
    console.log(userSumAmount);
    let [updateError] = await new UserModel().update({userName:userInfo.userName},{balance : userSumAmount});
    if(updateError) return [updateError,null]
    return [null, null];
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
        {name : "nickname", type:"S"},
        {name : "points", type:"N"},
        {name : "remark", type:"S", min:1, max:200},
    ], requestParams);
    if(checkAttError){
        Object.assign(checkAttError, {params: errorParams});
        return cb(null, ReHandler.fail(checkAttError));
    } 
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
    let {suffix} = merchantInfo;
    //实际的用户名
    let userName = requestParams.userName;
    console.log("merchantInfo");
    console.log(merchantInfo);
    let userModel = new UserModel({
        ...requestParams,
        buId : merchantInfo.displayId,
        userName : userName,
        merchantName : merchantInfo.displayName,
        msn : "000",
        balance : +requestParams.points
    });
    let [existError, flag] = await userModel.isExist(userName);
    if(existError) return ResFail(cb, existError);
    //用户已经注册
    if(flag) return ResFail(cb, new CHeraErr(CODES.userAlreadyRegister));
    //生成密码hash
    userModel.cryptoPassword();
    
    //代理余额
    let [agentBError, agentBalance] = await new MerchantBillModel({userId}).getBlance();
    agentBalance += +merchantInfo.points;  //需要加上初始点数
    if(agentBError)return ResFail(cb, agentBError);
    if(agentBalance < requestParams.points) {
        return ResFail(cb, new CHeraErr(CODES.AgentBalanceIns));
    }
    //保存玩家
    let [userSaveError] = await userModel.save();
    if(userSaveError) return ResFail(cb, userSaveError);
    let [userGetError, userInfo] = await new UserModel().get({userName});
    if(userGetError) return ResFail(cb, userSaveError);
    //玩家账单
    let baseBillModel = {
      fromRole : RoleCodeEnum.Agent,
      toRole : RoleCodeEnum.Player,
      fromUser : username,
      toUser : userName,
      msn : "000",
      amount : +requestParams.points,
      operator : username,
      remark : requestParams.remark,
      originalAmount : 0,
      gameType : -1,
      typeName : "代理存点"
    }
    let userBillModel = new UserBillModel({
        ...baseBillModel,
        action : 1,
        kindId : -2,
        userId : userInfo.userId,
        userName : userName,
        type : Type.agentOper,
        
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
    let [mError] = await merchantBillModel.save();
    if(mError) return callback(null, ReHandler.fail(mError));
    //更新玩家余额
    let [getBaError, userSumAmount] = await userBillModel.getBalance();
    if(getBaError) return callback(null, ReHandler.fail(getBaError));
    //更新余额
    let [updateBaError] = await new UserModel().update({userName},{balance : userSumAmount});
    if(updateBaError) return callback(null, ReHandler.fail(updateBaError));
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
/**
 * 
 * @param {*} event 
 * @param {*} context 
 * @param {*} cb 
 */
export async function updatePassword(event, context, cb) {
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
    let [parserErr, requestParams] = athena.Util.parseJSON(event.body || {});
    if(parserErr) {
        return ResFail(cb, parserErr);
    }
    //检查参数是否合法
    let [checkAttError, errorParams] = athena.Util.checkProperties([
        {name : "userName", type:"S"}
    ], requestParams);

    if(checkAttError){
        Object.assign(checkAttError, {params: errorParams});
        return ResFail(cb, checkAttError);
    } 
    let {userName} = requestParams;
    let password = Util.generatorPassword();
    requestParams.userPwd = password;
    let user = new UserModel(requestParams);
    let [userExistError, userRecord] = await user.get({userName});
    if(userExistError) return ResFail(cb, userExistError);
    if(!userRecord) return ResFail(cb, new CHeraErr(CODES.userNotExist));
    user.cryptoPassword();
    let [updateError] = await user.update({userName:userName},{userPwd:user.userPwd,password:password});
    if(updateError) {
      return callback(null, ReHandler.fail(updateError));
    }
    ResOK(cb, {data : {
        password
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
