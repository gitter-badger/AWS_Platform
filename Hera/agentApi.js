
let  athena  = require("./lib/athena");

import {CODES, CHeraErr} from "./lib/Codes";

import {ReHandler, JwtVerify} from "./lib/Response";

import {Model} from "./lib/Dynamo"


import {MerchantModel} from "./model/MerchantModel";

import {UserModel, State} from "./model/UserModel";

import {UserBillModel, Type} from "./model/UserBillModel";

import {MerchantBillModel} from "./model/MerchantBillModel";

import {LogModel} from "./model/LogModel";

import {Util} from "./lib/Util"

import {RoleCodeEnum} from "./lib/Consts";


const ResOK = (callback, res) => callback(null, ReHandler.success(res))
const ResFail = (callback, res) => {
    let errObj = {};
    errObj.err = res;
    errObj.code = res.code;
    callback(null, ReHandler.fail(errObj))
}

const logEnum = {
  "addPlayer" : {
    type :"operate",
    action : "创建玩家",
    detail : "创建成功",
  },
  "cudian" : {
    type :"operate",
    action : "玩家存点",
    detail : "成功",
  },
  "qudian" : {
    type :"operate",
    action : "玩家取点",
    detail : "成功",
  },
  "updatePassword" : {
      type :"operate",
    action : "修改玩家密码",
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
 * 代理玩家列表
 * @param {*} event 
 * @param {*} context 
 * @param {*} cb 
 */
export async function agentPlayerList(event, context, cb) {
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
    let role = tokenInfo.role;
    let parent = tokenInfo.parent;
    let sortKey = requestParams.sortKey || "createAt";
    let sortMode = requestParams.sortKey || "dsc";  //asc 升序  dsc 降序
    let displayId = +tokenInfo.displayId;
    let userModel = new UserModel();
    let flag  = false;
    if(requestParams.fromUserId) flag = true;
    let userId = requestParams.fromUserId || tokenInfo.userId
    let err, userList;
    if(role == RoleCodeEnum.Agent) {
        //找到所有下级
        // let [childrenError, childrenList] = await new MerchantModel().agentChildListByUids([tokenInfo.userId]);
        // if(childrenError) return ResFail(cb, childrenError)
        // let buIds = childrenList.map((item) => +item.displayId);
        // buIds.push(+displayId);
        // let userModel = new UserModel();
        // //找到代理所有用户
        // [err, userList] = await userModel.findByBuIds(buIds);
        if(parent == "00" && !flag) {
            
            Object.assign(requestParams, {
                msn : "000"
            })
            console.log("代理管理员");
            console.log(requestParams);
            [err, userList] = await userModel.playerList(requestParams);
        }else {
            requestParams.buId = userId;
            let [agentErr, agentInfo] = await new MerchantModel().findByUserId(userId);
            if(agentErr) return ResFail(cb, childrenError);
            if(!agentInfo){
                return ResFail(cb, new CHeraErr(CODES.AgentNotExist))
            }
            let userModel = new UserModel();
            //找到代理所有用户
            [err, userList] = await userModel.findByBuIds([+agentInfo.displayId], requestParams);
        }
    }else {
        return ResOK(cb, { list: []})
    }
    if (err) {
        return ResFail(cb, err)
    }
    userList = userList || [];
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
    userList.forEach(function(element) {
        console.log(element.createAt);
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
        {name : "toUser", type:"S"},
        {name : "amount", type:"N",min:1},
    ], requestParams);
    requestParams.userName = requestParams.toUser;
    requestParams.points = requestParams.amount;
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
    //玩家是否正在游戏中
    let gameing = new UserModel().isGames(userInfo);
    if(gameing) {
        return ResFail(cb, new CHeraErr(CODES.gameingError));
    }
    let userId = requestParams.fromUserId || tokenInfo.userId;
    const [queryMerchantError, merchantInfo] = await new MerchantModel().findByUserId(userId);

    if(queryMerchantError) {
        return ResFail(cb, queryMerchantError); 
    }
    if(!merchantInfo) {
        return ResFail(cb, new CHeraErr(CODES.AgentNotExist)); 
    }
    
    let [cudianErr] = await cudian(userInfo, merchantInfo, requestParams, tokenInfo);
    if(cudianErr) {
        return ResFail(cb, cudianErr);
    }
    let [userBErr, points] = await new UserBillModel({userName:userInfo.userName}).getBalance();
    if(userBErr) {
        return ResFail(cb, cudianErr);
    }
    return successHandler(cb, {data:{points}}, "cudian", tokenInfo, userInfo);
    // ResOK(cb, {data:{points}});
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
        {name : "toUser", type:"S"},
        {name : "amount", type:"N",min:1},
    ], requestParams);
    requestParams.userName = requestParams.toUser;
    requestParams.points = requestParams.amount;
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
    //玩家是否正在游戏中
    let gameing = new UserModel().isGames(userInfo);
    if(gameing) {
        return ResFail(cb, new CHeraErr(CODES.gameingError));
    }
    let userId = requestParams.fromUserId || tokenInfo.userId; //如果传了userID，则扣除userId账户的点数
    const [queryMerchantError, merchantInfo] = await new MerchantModel().findByUserId(userId);

    if(queryMerchantError) {
        return ResFail(cb, queryMerchantError); 
    }
    if(!merchantInfo) {
        return ResFail(cb, new CHeraErr(CODES.AgentNotExist)); 
    }
    let [cudianErr] = await qudian(userInfo, merchantInfo, requestParams, tokenInfo);
    if(cudianErr) {
        return ResFail(cb, cudianErr);
    }
    let [userBErr, points] = await new UserBillModel({userName:userInfo.userName}).getBalance();
    if(userBErr) {
        return ResFail(cb, cudianErr);
    }
    return successHandler(cb, {data:{points}}, "qudian", tokenInfo, userInfo);
    // ResOK(cb, {data:{points}});
}

async function qudian(userInfo, merchantInfo, requestParams, tokenInfo) {
    //玩家余额
    let [playerBError, playerBalance] = await new UserBillModel({userName:userInfo.userName}).getBalance();
    if(playerBError)return ResFail(cb, agentBError);
    if(playerBalance < requestParams.points) {
        return [new CHeraErr(CODES.AgentBalanceIns), null];
    }
    //玩家账单
    let baseBillModel = {
      fromRole : RoleCodeEnum.Player,
      toRole : RoleCodeEnum.Agent,
      fromUser : userInfo.userName,
      toUser : merchantInfo.username,
      msn : "000",
      amount : +requestParams.points,
      operator : tokenInfo.username,
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
        fromLevel : 10000,
        toLevel : merchantInfo.level,
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
async function cudian(userInfo, merchantInfo, requestParams, tokenInfo){
    //玩家余额
    let [playerBError, playerBalance] = await new UserBillModel({userName:userInfo.userName}).getBalance();
    if(playerBError)return ResFail(cb, agentBError);
    //代理余额
    let [agentBError, agentBalance] = await new MerchantBillModel({userId:merchantInfo.userId}).getBlance();
    agentBalance += +merchantInfo.points;  //需要加上初始点数
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
      operator : tokenInfo.username,
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
        fromLevel : merchantInfo.level,
        toLevel : 10000,
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
 * 下级代理
 * @param {*} event 
 * @param {*} context 
 * @param {*} cb 
 */
export async function childrenAgent(event, context, cb) {
    const [tokenErr, token] = await Model.currentToken(event);
    if (tokenErr) {
        return ResFail(cb, tokenErr)
    }
    const [e, tokenInfo] = await JwtVerify(token[1])
    if(e) {
        return ResFail(cb, e)
    }
    let [parserErr, requestParams] = athena.Util.parseJSON(event.body || {});
    if(parserErr) {
        return ResFail(cb, parserErr);
    }
    //创建者信息
    let {userId,username, role, parent, liveMix, vedioMix,displayName} = tokenInfo;
    let [agentErr, agentInfo] = await new MerchantModel().findByUserId(userId);
    if(agentErr) {
        return ResFail(cb, agentErr);
    }
    if(!agentInfo) {
        return ResFail(cb, new CHeraErr(CODES.AgentNotExist));
    }
    //获取所有下级代理
    let merchant = new MerchantModel();
    let queryMerchantError, agentList;
    if(parent == "00") {
        [queryMerchantError, agentList] = await merchant.scan({role:RoleCodeEnum.Agent});
        for(let i = 0; i < agentList.length; i++) {
            let agent = agentList[i];
            if(agent.parent == '00') {
                agentList.splice(i, 1);
                i --;
            }
        }
    }else {
        [queryMerchantError, agentList] = await merchant.agentChildListByUids([userId]);
        if(!queryMerchantError) agentList.unshift({
            userId,
            username,
            liveMix,
            vedioMix,
            displayName,
            points : agentInfo.points
        })
    }
    
    if(queryMerchantError) {
        return cb(null, ReHandler.fail(queryMerchantError));
    }
    let returnArr = agentList.map((item) => {
        return {
            userId : item.userId,
            username : item.username,
            liveMix : item.liveMix,
            vedioMix : item.vedioMix,
            displayName : item.displayName,
            points : item.points,
        }
    })
    //获取代理点数
    for(let i =0; i < returnArr.length; i ++) {
        let [bErr, balance] = await new MerchantBillModel({userId:returnArr[i].userId}).getBlance();
        if(bErr) {
            return cb(null, ReHandler.fail(bErr));
        }
        returnArr[i].points += balance;
    }
    ResOK(cb, {list : returnArr});
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
        {name : "parentId", type:"S"},
        {name : "userName", type:"S", min:6, max:16},
        {name : "userPwd", type:"S", min:6, max :16},
        {name : "points", type:"N"},
        {name : "liveMix", type:"N",min:0}, //真人洗码比
        {name : "vedioMix", type:"N",min:0}, //电子游戏洗码比
    ], requestParams);
    if(checkAttError){
        Object.assign(checkAttError, {params: errorParams});
        return cb(null, ReHandler.fail(checkAttError));
    }
    //创建者信息
    let {userId,username, role} = tokenInfo;
    if(role != RoleCodeEnum.Agent) {
        return ResFail(cb, new CHeraErr(CODES.NotAuth)); 
    }
    //获取商家信息
    const merchant = new MerchantModel();
    const [queryMerchantError, merchantInfo] = await merchant.findByUserId(requestParams.parentId);

    if(queryMerchantError) {
        return ResFail(cb, queryMerchantError); 
    }
    if(!merchantInfo) {
        return ResFail(cb, new CHeraErr(CODES.AgentNotExist)); 
    }
    if(merchantInfo.role != RoleCodeEnum.Agent) {
        return ResFail(cb, new CHeraErr(CODES.NotAuth)); 
    }
    let {liveMix, vedioMix} = merchantInfo;
    if(requestParams.liveMix > liveMix || requestParams.vedioMix > vedioMix) {
        return ResFail(cb, new CHeraErr(CODES.mixError)); 
    }
    let {suffix} = merchantInfo;
    //实际的用户名
    let userName = requestParams.userName;
    delete requestParams.nickName;
    delete requestParams.balance;
    console.log("merchantInfo");
    console.log(merchantInfo);
    let userModel = new UserModel({
        ...requestParams,
        buId : merchantInfo.displayId,
        userName : userName,
        parent : merchantInfo.userId,
        parentName : merchantInfo.username,
        merchantName : merchantInfo.displayName,
        msn : "000",
        balance : +requestParams.points
    });
    let [existError, flag] = await userModel.isExist(userName);
    if(existError) return ResFail(cb, existError);
    //用户已经注册
    if(flag){
         return ResFail(cb, new CHeraErr(CODES.userAlreadyRegister));
    }
    //生成密码hash
    userModel.cryptoPassword();
    
    //代理余额
    let [agentBError, agentBalance] = await new MerchantBillModel({userId:requestParams.parentId}).getBlance();
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
      fromUser : merchantInfo.username,
      toUser : userName,
      msn : "000",
      amount : +requestParams.points,
      operator : tokenInfo.username,
      remark : requestParams.remark,
      originalAmount : 0,
      gameType : -1,
      typeName : "代理分配初始点数"
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
        fromLevel : merchantInfo.level,
        toLevel : 10000,
    });
    let [mError] = await merchantBillModel.save();
    if(mError) return callback(null, ReHandler.fail(mError));
    //更新玩家余额
    let [getBaError, userSumAmount] = await userBillModel.getBalance();
    if(getBaError) return callback(null, ReHandler.fail(getBaError));
    //更新余额
    let [updateBaError] = await new UserModel().update({userName},{balance : userSumAmount});
    if(updateBaError) return callback(null, ReHandler.fail(updateBaError));
    return successHandler(cb, {data : userInfo}, "addPlayer", tokenInfo, userInfo);
    // ResOK(cb, {data : userInfo});
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
        {name : "userName", type:"S"},
        {name : "password", type:"S"}
    ], requestParams);

    if(checkAttError){
        Object.assign(checkAttError, {params: errorParams});
        return ResFail(cb, checkAttError);
    } 
    let {userName, password} = requestParams;
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
    return successHandler(cb, {data : {
        password
    }}, "updatePassword", tokenInfo, {});
    // ResOK(cb, {data : {
    //     password
    // }});
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
