
let  athena  = require("./lib/athena");

import {CODES, CHeraErr} from "./lib/Codes";

import {ReHandler} from "./lib/Response";

import {RoleCodeEnum} from "./lib/Consts"


import {MerchantModel} from "./model/MerchantModel";

import {UserModel, PaymentState, State} from "./model/UserModel";

import {UserBillModel, Type} from "./model/UserBillModel";

import {MSNModel} from "./model/MSNModel";

import {GameModel} from "./model/GameModel";

import {GameRecordModel} from "./model/GameRecordModel";

import {MerchantBillModel,Action} from "./model/MerchantBillModel";

import {UserRecordModel} from "./model/UserRecordModel";

import {UserDiamondBillModel} from "./model/UserDiamondBillModel";

import {Util} from "./lib/Util"


const gamePlatform = "NA"

function validateIp(event, merchant) {
  let loginWhiteStr = merchant.loginWhiteList;
  let whiteList = loginWhiteStr.split(",");
  whiteList.forEach(function(element) {
    element.trim();
  }, this);
  console.log("event.headers.identity");
  console.log(event.requestContext.identity);
  console.log(whiteList);
  let sourceIp = event.requestContext.identity.sourceIp;
  let whiteIp = whiteList.find((ip) => ip == sourceIp);
  if(whiteIp) return true;
  return false;
}

/**
 * 玩家注册
 * @param {*} event 
 * @param {*} context 
 * @param {*} callback 
 */
async function gamePlayerRegister(event, context, callback) {

  //json转换
  let [parserErr, requestParams] = athena.Util.parseJSON(event.body);
  if(parserErr) return callback(null, ReHandler.fail(parserErr));
  //检查参数是否合法
  let [checkAttError, errorParams] = athena.Util.checkProperties([
      {name : "userName", type:"S", min:6, max :12},
      {name : "userPwd", type:"S", min:6, max :16},
      {name : "buId", type:"N"},
      {name : "apiKey", type:"S", min:1},
      {name : "userType", type:"N", equal:1},
      {name : "gamePlatform", type:"S", equal:gamePlatform}
  ], requestParams);
  if(checkAttError){
    Object.assign(checkAttError, {params: errorParams});
    return callback(null, ReHandler.fail(checkAttError));
  } 
  let {buId, userName, userPwd, apiKey, userType, gamePlatform} = requestParams;

  //检查商户信息是否正确
  const merchant = new MerchantModel();
  const [queryMerchantError, merchantInfo] = await merchant.findById(+buId);
  if(queryMerchantError) return callback(null, ReHandler.fail(queryMerchantError));
  if(!merchantInfo || !Object.is(merchantInfo.apiKey, apiKey)){
    return callback(null, ReHandler.fail(new CHeraErr(CODES.merchantNotExist)));
  } 
  //验证白名单
  let white = validateIp(event, merchantInfo);
  if(!white) {
    return callback(null, ReHandler.fail(new CHeraErr(CODES.ipError)));
  }
  Object.assign(requestParams, {
    msn : merchantInfo.msn,
    merchantName : merchantInfo.displayName,
    amount : 0
  })
  //判断用户是否存在
  userName = `${merchantInfo.suffix}_${userName}`;
  requestParams.userName = userName;
  let user = new UserModel(requestParams);
  let [existError, flag] = await user.isExist(userName);
  if(existError) return callback(null, ReHandler.fail(existError));
  //用户已经注册
  if(flag) return callback(null, ReHandler.fail(new CHeraErr(CODES.userAlreadyRegister)));
  //生成密码hash
  user.cryptoPassword();
  let [userSaveError, userInfo] = await user.save();
  if(userSaveError) return callback(null, ReHandler.fail(userSaveError));

  callback(null, ReHandler.success({}));

}


/**
 * 玩家登陆
 * @param {*} event 
 * @param {*} context 
 * @param {*} callback 
 */
async function gamePlayerLogin(event, context, callback) {
  //json转换
  let [parserErr, requestParams] = athena.Util.parseJSON(event.body);

  if(parserErr) return callback(null, ReHandler.fail(parserErr));
    //检查参数是否合法
  let [checkAttError, errorParams] = athena.Util.checkProperties([
      {name : "userName", type:"S", min:6, max :12},
      {name : "userPwd", type:"S", min:6, max :16},
      {name : "buId", type:"N"},
      {name : "apiKey", type:"S", min:1},
      {name : "gamePlatform", type:"S", equal:gamePlatform}
  ], requestParams);
  if(checkAttError){
    Object.assign(checkAttError, {params: errorParams});
    return callback(null, ReHandler.fail(checkAttError));
  } 
  let {buId, userName, userPwd, apiKey, gamePlatform} = requestParams;
  //检查商户信息是否正确
  const merchant = new MerchantModel();
  const [queryMerchantError, merchantInfo] = await merchant.findById(+buId);
  if(queryMerchantError) return callback(null, ReHandler.fail(queryMerchantError));
  if(!merchantInfo || !Object.is(merchantInfo.apiKey, apiKey)){
    return callback(null, ReHandler.fail(new CHeraErr(CODES.merchantNotExist)));
  } 
  //验证白名单
  let white = validateIp(event, merchantInfo);
  if(!white) {
    return callback(null, ReHandler.fail(new CHeraErr(CODES.ipError)));
  }
  userName = `${merchantInfo.suffix}_${userName}`;
  let user = new UserModel(requestParams);
  let [userExistError, userInfo] = await user.get({userName});
  if(userExistError) return callback(null, ReHandler.fail(userExistError));
  if(!userInfo) return callback(null, ReHandler.fail(new CHeraErr(CODES.userNotExist)));
  //账号已冻结
  if(userInfo.state == State.forzen) return callback(null, ReHandler.fail(new CHeraErr(CODES.Frozen)));
  //验证密码
  let flag = user.vertifyPassword(userInfo.userPwd);
  if(!flag) return callback(null, ReHandler.fail(new CHeraErr(CODES.passwordError)));
  let loginToken = Util.createTokenJWT({userName,suffix:merchantInfo.suffix,userId:userInfo.userId});
  let [updateError] = await user.update({userName: userName},{ updateAt:Date.now()});
  if(updateError) return callback(null, ReHandler.fail(updateError));
  callback(null, ReHandler.success({
      data:{token : loginToken, msn:merchantInfo.msn}
  }));
}

/**
 * 用户余额
 * @param event
 * @param context
 * @param callback
 */
async function getGamePlayerBalance(event, context, callback) {
  console.log(event);  
  let userName = event.pathParameters.userName;
  //验证token
  let [err, userInfo] = await Util.jwtVerify(event.headers.Authorization);
  if(err || !Object.is(userInfo.suffix+"_"+userName, userInfo.userName)) return callback(null, ReHandler.fail(new CHeraErr(CODES.TokenError)));
    //json转换
  let [parserErr, requestParams] = athena.Util.parseJSON(event.queryStringParameters || {});

  if(parserErr) return callback(null, ReHandler.fail(parserErr));
  
    //检查参数是否合法
  let [checkAttError, errorParams] = athena.Util.checkProperties([
      {name : "buId", type:"N", min:1},
      {name : "gamePlatform", type:"S", equal:gamePlatform}
  ], requestParams);

  if(checkAttError){
    Object.assign(checkAttError, {params: errorParams});
    return callback(null, ReHandler.fail(checkAttError));
  } 
  //检查商户信息是否正确
  const merchant = new MerchantModel();
  const [queryMerchantError, merchantInfo] = await merchant.findById(+requestParams.buId);
  if(queryMerchantError) return callback(null, ReHandler.fail(queryMerchantError));
  if(!merchantInfo){
    return callback(null, ReHandler.fail(new CHeraErr(CODES.merchantNotExist)));
  } 
  //验证白名单
  let white = validateIp(event, merchantInfo);
  if(!white) {
    return callback(null, ReHandler.fail(new CHeraErr(CODES.ipError)));
  }
  userName = `${merchantInfo.suffix}_${userName}`;
  let userBill = new UserBillModel({userName});
  let [bError, balance] = await userBill.getBalance();
  if(bError) return callback(null, ReHandler.fail(bError));
  callback(null, ReHandler.success({
      data :{balance : balance}
  }));
}

/**
 * 用户充值/提现
 * @param event
 * @param context
 * @param callback
 */
async function gamePlayerBalance(event, context, callback) {
    console.log(event);
    let userName = event.pathParameters.userName;
    //验证token
    let [err, userInfo] = await Util.jwtVerify(event.headers.Authorization);
    if(err || !Object.is(userInfo.suffix+"_"+userName, userInfo.userName)) return callback(null, ReHandler.fail(new CHeraErr(CODES.TokenError)));

    //json转换
    let [parserErr, requestParams] = athena.Util.parseJSON(event.body);
    if(parserErr) return callback(null, ReHandler.fail(parserErr));

    //检查参数是否合法
    let [checkAttError, errorParams] = athena.Util.checkProperties([
        {name : "buId", type:"N"},
        {name : "amount", type:"N", min:0},
        {name : "action", type:"N"},
    ], requestParams);


    if(checkAttError){
      Object.assign(checkAttError, {params: errorParams});
      return callback(null, ReHandler.fail(checkAttError));
    } 
    let action = +requestParams.action;
    

    if(!Object.is(action, 1) && !Object.is(action, -1)){
      return callback(null, ReHandler.fail(new CHeraErr(CODES.DataError)));
    }
    //获取商家
    let [merError, merchantInfo] = await new MerchantModel().findById(+requestParams.buId);
    
    if(merError) return callback(null, ReHandler.fail(merError));
    if(!merchantInfo) return callback(null, ReHandler.fail(new CHeraErr(CODES.merchantNotExist)));
    //验证白名单
    let white = validateIp(event, merchantInfo);
    if(!white) {
      return callback(null, ReHandler.fail(new CHeraErr(CODES.ipError)));
    }
    userName = `${merchantInfo.suffix}_${userName}`;
    requestParams.userName = userName;
    let baseModel = {
      fromRole : RoleCodeEnum.Player,
      toRole : RoleCodeEnum.Merchant,
      fromUser : userName,
      toUser : merchantInfo.username,
      amount : +requestParams.amount,
      operator : userName,
      remark : " ",
      gameType : -1,
      typeName : action > 0 ? "中心钱包转入" : "中心钱包转出"
    }
    //检查玩家点数是否足够 如果是玩家提现才检查，充值不需要
    let userBillModel = new UserBillModel(requestParams);
    let [pError, palyerBalance] = await userBillModel.getBalance(); //获取玩家余额
    if(pError) return callback(null, ReHandler.fail(pError)); 
    if(action == -1) {
      if(palyerBalance < +requestParams.amount){
         return callback(null, ReHandler.fail(new CHeraErr(CODES.palyerIns)));
      }
    }
    //获取用户信息
    let u = new UserModel();
    let [getUserError, user] = await u.get({userName});
    if(!user) return callback(null, ReHandler.fail(new CHeraErr(CODES.userNotExist)));
    //玩家是否正在游戏中
    let gameing = u.isGames(user);
    if(gameing) {
      return callback(null, ReHandler.fail(new CHeraErr(CODES.gameingError)));
    }
    let merchantObj = {
      ...baseModel,
      username : merchantInfo.username,
      userId : merchantInfo.userId,
      action : -action,
    };
    Object.assign(merchantObj, baseModel)
    //商户点数变化
    let merchantBillModel = new MerchantBillModel(merchantObj);
    let [mError, amount] = await merchantBillModel.handlerPoint();
    if(mError) return callback(null, ReHandler.fail(mError));

    //保存玩家账单
    Object.assign(userBillModel, {
       ...baseModel,
       userName : userName,
       userId : user.userId,
       originalAmount : palyerBalance,
       msn : merchantInfo.msn,
       merchantName : merchantInfo.displayName,
       type : action > 0 ? Type.recharge : Type.withdrawals
    })
    userBillModel.setAmount(userBillModel.amount);
    let [saveError] = await userBillModel.save();
    if(saveError) return callback(null, ReHandler.fail(saveError));
    //查账
    let [getError, userSumAmount] = await userBillModel.getBalance();
    if(getError) return callback(null, ReHandler.fail(getError));
    console.log("palyer");
    console.log(userBillModel);
    //更新余额
    let [updateError] = await u.update({userName},{balance : userSumAmount});
    if(updateError) return callback(null, ReHandler.fail(updateError));

    callback(null, ReHandler.success({
      data:{balance : userSumAmount}
    }));
}

/**
 * A3游戏登陆
 * @param {*} event 
 * @param {*} context 
 * @param {*} callback 
 */
async function gamePlayerA3Login(event, context, callback) {
  console.log(event);
  //json转换
  let [parserErr, requestParams] = athena.Util.parseJSON(event.body);

  if(parserErr) return callback(null, ReHandler.fail(parserErr));
    //检查参数是否合法
  let [checkAttError, errorParams] = athena.Util.checkProperties([
      {name : "userName", type:"S"},
      {name :"msn", type:"S"},
      {name : "userPwd", type:"S", min:6, max :16}
  ], requestParams);
  if(checkAttError){
    Object.assign(checkAttError, {params: errorParams});
    return callback(null, ReHandler.fail(checkAttError));
  } 

  let {userName, userPwd, msn} = requestParams;

  //根据线路号获取商家
  let msnModel = new MSNModel();
  let msnError, merchantInfo;
  if(msn != "000") {
    [msnError, merchantInfo] = await msnModel.findMerchantByMsn(msn);
    if(msnError) {
      return callback(null, ReHandler.fail(msnError));
    }
    if(!merchantInfo) {
      return callback(null, ReHandler.fail(new CHeraErr(CODES.merchantNotExist)));
    }
    userName = `${merchantInfo.suffix}_${userName}`; 
  }
  let user = new UserModel(requestParams);
  let [userExistError, userInfo] = await user.get({userName:userName});
  if(userExistError) return callback(null, ReHandler.fail(userExistError));
  if(!userInfo) return callback(null, ReHandler.fail(new CHeraErr(CODES.userNotExist)));
  //账号已冻结
  if(userInfo.state == State.forzen) return callback(null, ReHandler.fail(new CHeraErr(CODES.Frozen)));
  //验证密码
  let flag = user.vertifyPassword(userInfo.userPwd);
  if(!flag) return callback(null, ReHandler.fail(new CHeraErr(CODES.passwordError)));
  let suffix = userInfo.userName.split("_")[0];
  let loginToken = Util.createTokenJWT({userName : userInfo.userName, suffix:suffix, userId:+userInfo.userId});
  let [updateError] = await user.update({userName: userInfo.userName},{updateAt:Date.now()});
  if(updateError) return callback(null, ReHandler.fail(updateError));
  //获取余额
  let userBill = new UserBillModel(userInfo);
  let [bError, balance] = await userBill.getBalance();
  if(bError) {
    return callback(null, ReHandler.fail(updateError));
  }
  //获取玩家钻石
  let [diamondErr, diamonds] = await new UserDiamondBillModel({userName}).getBalance();
  if(diamondErr) {
    return callback(null, ReHandler.fail(diamondErr));
  }
  let callObj = {
    data : {
      token : loginToken,
      balance : balance,
      diamonds : diamonds,
      msn : userInfo.msn,
      createAt : userInfo.createAt,
      updateAt : userInfo.updateAt,
      username : userName.split("_")[1],
      userId : userInfo.userId,
      nickname : userInfo.nickname,
      headPic : userInfo.headPic,
      sex : userInfo.sex || 0
    }
  }
  callback(null, ReHandler.success(callObj));
}


/**
 * 用户余额（A3）
 * @param event
 * @param context
 * @param callback
 */
async function getA3GamePlayerBalance(event, context, callback) {
  console.log(event);
  //json转换
  let [parserErr, requestParams] = athena.Util.parseJSON(event.queryStringParameters);
  if(parserErr) return callback(null, ReHandler.fail(parserErr));
  //检查参数是否合法
  let [checkAttError, errorParams] = athena.Util.checkProperties([
      {name : "userId", type:"N"}
  ], requestParams);

  if(checkAttError){
    Object.assign(checkAttError, {params: errorParams});
    return callback(null, ReHandler.fail(checkAttError));
  } 
  let userId = +requestParams.userId;
  //验证token
  let [err, userInfo] = await Util.jwtVerify(event.headers.Authorization);
  if(err ||  !userInfo || !Object.is(+userId, +userInfo.userId)){
    return callback(null, ReHandler.fail(new CHeraErr(CODES.TokenError)));
  }
  let userName = userInfo.userName;
  let userBill = new UserBillModel(userInfo);
  console.log(typeof +userId);

  let [bError, balance] = await userBill.getBalance();
  if(bError) return callback(null, ReHandler.fail(bError));
  //获取玩家钻石
  let [diamondErr, diamonds] = await new UserDiamondBillModel({userName}).getBalance();
  if(diamondErr) {
    return callback(null, ReHandler.fail(diamondErr));
  }
  callback(null, ReHandler.success({
      data :{balance : balance, diamonds}
  }));
}

/**
 * 玩家账单验证
 * @param {*} event 
 * @param {*} context 
 * @param {*} callback 
 */
async function playerRecordValidate(event, context, callback){
  console.log(event);
  let [validateError, params, userInfo, requestParams] = await validateGame(event, [
    {name : "gameId", type:"N"},
    {name : "records", type:"J"},
    {name :"checkOutBalance", type:"N"}
  ]);
  if(validateError) {
     Object.assign(validateError, {params: params});
     return callback(null, ReHandler.fail(validateError));
  }
  let userId = +userInfo.userId;
  let gameId = requestParams.gameId;
  //获取用户数据
  let [uError, userModel] = await new UserModel().get({userId},[], "userIdIndex");
  if(uError) {
    return callback(null, ReHandler.fail(uError));
  }

  if(!userModel) {
    return callback(null, ReHandler.fail(new CHeraErr(CODES.userNotExist)));
  }
  let records = requestParams.records || [];
  //获取玩家余额
  let [playerErr, oriBalance] = await new UserBillModel().getBalanceByUid(userId);
  if(playerErr) {
      return callback(null, ReHandler.fail(playerErr));
  }
  //如果记录没有，直接跳过
  if(records.length == 0) { //如果记录为null
    //解除玩家状态
    let [gameError] = await new UserModel().updateGameState(userModel.userName, PaymentState.allow);
    if(gameError) {
      return callback(null, ReHandler.fail(gameError));
    }
    return callback(null, ReHandler.success({
      data :{balance : b}
    }));
  }
  //获取游戏
  let [gError, gameInfo] = await new GameModel({gameId}).findByKindId(gameId);
  if(gError) {
    return callback(null, ReHandler.fail(gError));
  }
  if(!gameInfo) {
    return callback(null, ReHandler.fail(new CHeraErr(CODES.gameNotExist)));
  }
  let typeName = gameInfo.gameName;
  let userRecordModel = new UserRecordModel(requestParams);
  userRecordModel.depositAmount = oriBalance;
  let [validErr, income] = userRecordModel.validateRecords(records);
  if(validErr) {
    return callback(null, ReHandler.fail(err));
  }
  
  //验证余额是否正确
  if((oriBalance + income).toFixed(2) != userRecordModel.checkOutBalance.toFixed(2)) {
    return callback(null, ReHandler.fail(new CHeraErr(CODES.playerRecordError.billNotMatchErr)));
  }
  let userAction = income < 0 ? Action.reflect : Action.recharge; //如果用户收益为正数，用户action为1

  //获取商家
  let merchantId = userModel.buId;
  let [meError, merchantModel] = await new MerchantModel().findById(merchantId);
  if(meError) {
    return callback(null, ReHandler.fail(meError));
  }
  if(!merchantModel) {
    return callback(null, ReHandler.fail(new CHeraErr(CODES.merchantNotExist)));
  }
  let [recordSError] = await userRecordModel.save();
  
  if(recordSError) {
    return callback(null, ReHandler.fail(recordSError));
  }
  let billBase = {
    fromRole : RoleCodeEnum.Player,
    toRole : RoleCodeEnum.Merchant,
    fromUser : userModel.userName,
    toUser : merchantModel.username,
    operator : userModel.userName,
    merchantName : merchantModel.displayName,
    kindId : gameId,
    gameType : gameInfo.gameType,
    msn : merchantModel.msn,
    type : Type.gameSettlement,
    typeName : typeName,
    remark : "游戏结算"
  }
  
  //玩家点数发生变化
  let userBillModel = new UserBillModel({
    userId : +userModel.userId,
    action : userAction,
    userName : userModel.userName,
    amount : income
  })
 
  userBillModel.originalAmount = oriBalance;
  Object.assign(userBillModel, billBase);

  let [recordErr] = await userRecordModel.save();
  if(recordErr) {
    return callback(null, ReHandler.fail(uSaveErr));
  }

  let [uSaveErr] = await userBillModel.save();
  if(uSaveErr) {
    return callback(null, ReHandler.fail(uSaveErr));
  }
  
  //查账
  let [getError, userSumAmount] = await userBillModel.getBalance();
  if(getError){
     return callback(null, ReHandler.fail(getError));
  }
  //更新余额
  let u = new UserModel(); 
  let [updatebError] = await u.update({userName:userModel.userName},{balance : userSumAmount});
  if(updatebError) return callback(null, ReHandler.fail(updatebError));
  //解除玩家状态
  let [gameError] = await u.updateGameState(userModel.userName, PaymentState.allow);
  if(gameError) {
    return callback(null, ReHandler.fail(gameError));
  }
  callback(null, ReHandler.success({
      data :{balance : userSumAmount}
  }));
}
/**
 * 玩家进入游戏
 * @param {*} event 
 * @param {*} context 
 * @param {*} callback 
 */
async function joinGame(event, context, callback){
  //json转换
  let [parserErr, requestParams] = athena.Util.parseJSON(event.body || {});
  if(parserErr) return callback(null, ReHandler.fail(parserErr));
  //检查参数是否合法
  let [checkAttError, errorParams] = athena.Util.checkProperties([
      {name : "userId", type:"N"}
  ], requestParams);
  let userId = +requestParams.userId;
  //验证token
  let [err, userInfo] = await Util.jwtVerify(event.headers.Authorization);
  if(err ||  !userInfo || !Object.is(+userId, +userInfo.userId)){
    return callback(null, ReHandler.fail(new CHeraErr(CODES.TokenError)));
  }

  //更改状态
  let userModel = new UserModel();
  let [usergetError, userObj] = await userModel.get({userId},[], "userIdIndex");
  if(usergetError) {
    return callback(null, ReHandler.fail(usergetError));
  }
  if(!userObj) {
    return callback(null, ReHandler.fail(new CHeraErr(CODES.userNotExist)));
  }
  //判断是否正在游戏中
  let game = userModel.isGames(userObj);
  if(game) {
      return callback(null, ReHandler.fail(new CHeraErr(CODES.gameingError)));
  }
  //修改游戏状态（不能进行转账操作）
  let [updateError] = await userModel.updateGameState(userObj.userName, PaymentState.forbid);
  if(updateError) {
    return callback(null, ReHandler.fail(updateError));
  }
  let userBill = new UserBillModel(userObj);
  let [bError, balance] = await userBill.getBalance();
  if(bError) return callback(null, ReHandler.fail(bError));
  callback(null, ReHandler.success({
      data :{balance : balance}
  }));
}

/**
 * 修改密码
 * @param {*} event 
 * @param {*} context 
 * @param {*} calllback 
 */
async function updatePassword(event, context, callback) {
    console.log(event);
    let userName = event.pathParameters.userName;
    
    //验证token
    let [err, userInfo] = await Util.jwtVerify(event.headers.Authorization);
    console.log(userInfo);
    if(err || !userInfo ||  !Object.is(userInfo.suffix+"_"+userName, userInfo.userName)){
       return callback(null, ReHandler.fail(new CHeraErr(CODES.TokenError)));
    }
    //json转换
    let [parserErr, requestParams] = athena.Util.parseJSON(event.body);
    if(parserErr) return callback(null, ReHandler.fail(parserErr));

    //检查参数是否合法
    let [checkAttError, errorParams] = athena.Util.checkProperties([
        {name : "userPwd", type:"S"},
    ], requestParams);
    if(checkAttError){
      Object.assign(checkAttError, {params: errorParams});
      return callback(null, ReHandler.fail(checkAttError));
    }
    let user = new UserModel(requestParams);
    let [userExistError, userRecord] = await user.get({userName:userInfo.userName});
    if(userExistError) return callback(null, ReHandler.fail(userExistError));
    if(!userRecord) return callback(null, ReHandler.fail(new CHeraErr(CODES.userNotExist)));
    user.cryptoPassword();
    let [updateError] = await user.update({userName:userInfo.userName},{userPwd:user.userPwd,password:requestParams.userPwd});
    if(updateError) {
      return callback(null, ReHandler.fail(updateError));
    }
    callback(null, ReHandler.success());
}

/**
 *修改用户基本信息 
 * @param {*} event 
 * @param {*} context 
 * @param {*} callback 
 */
async function updateUserInfo(event, context, callback) {
  let [validateError, params, userInfo, requestParams] = await validateGame(event);
  if(validateError) {
    if(params.length>0){
      Object.assign(validateError, {params: params});
    }
    return callback(null, ReHandler.fail(validateError));
  }
  let user = new UserModel();
  let [userExistError, userRecord] = await user.get({userName:userInfo.userName});
  if(userExistError) {
    return callback(null, ReHandler.fail(userExistError));
  }
  let obj = {};
  for(let key in requestParams) {
    if(Object.is(key, "nickname") || Object.is(key, "headPic") || Object.is(key, "sex")) {
      if(requestParams[key]) {
          obj[key] = requestParams[key];
      }
    }
  }
  //nickname不能重复
  if(requestParams.nickname){
    let [nicknameErr, nickUser] = await new UserModel().getUserByNickname(requestParams.nickname);
    if(nicknameErr) {
      return callback(null, ReHandler.fail(nicknameErr));
    }
    if(nickUser) {
      if(nickUser.userId != userInfo.userId) {  //如果不是本人
        return callback(null, ReHandler.fail(new CHeraErr(CODES.nicknameAlreadyExist)));
      }
    }
  }
  if(obj.sex != 1 && obj.sex!=2) delete obj.sex;
  let [updateErr] = await user.update({userName:userInfo.userName}, obj);
  if(updateErr) {
    return callback(null, ReHandler.fail(updateErr));
  }
  callback(null, ReHandler.success());
}

/**
 * 玩家游戏记录
 * @param {*} event 
 * @param {*} context 
 * @param {*} callback 
 */
async function playerGameRecord(event, context, callback) {
  console.log(event);
  let [validateError, params, userInfo, requestParams] = await validateGame(event)
  if(validateError) {
     Object.assign(validateError, {params: params});
     return callback(null, ReHandler.fail(validateError));
  }
  let gameRecord = new GameRecordModel({record:requestParams,userId:userInfo.userId});
  let [saveErr] = await gameRecord.save();
  if(saveErr) {
    return callback(null, ReHandler.fail(saveErr));
  }
  callback(null, ReHandler.success({}));
}

async function validateGame(event, params = []){
   //json转换
  let [parserErr, requestParams] = athena.Util.parseJSON(event.body || {});
  if(parserErr) return [parserErr, [], null, requestParams];
  //检查参数是否合法
  params.push({name : "userId", type:"N"});
  let [checkAttError, errorParams] = athena.Util.checkProperties(params, requestParams);
  if(checkAttError) {
    return [checkAttError, errorParams, null, requestParams];
  }
  let userId = +requestParams.userId;
  //验证token
  let [err, userInfo] = await Util.jwtVerify(event.headers.Authorization);
  if(err ||  !userInfo || !Object.is(+userId, +userInfo.userId)){
    return [new CHeraErr(CODES.TokenError), [], null, requestParams]
  }
  return [null, [], userInfo, requestParams]
}


export{
  gamePlayerRegister, //玩家注册
  gamePlayerLogin,    //玩家登陆
  getGamePlayerBalance,  //用户余额
  gamePlayerBalance,  //玩家充值提现
  gamePlayerA3Login, //A3游戏登陆
  getA3GamePlayerBalance, //用户余额（A3）
  playerRecordValidate,  //玩家账单验证
  joinGame, //进入游戏
  updatePassword, //修改密码
  updateUserInfo,  //修改用户基本信息
  playerGameRecord, //玩家记录
}