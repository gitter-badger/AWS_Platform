
let  athena  = require("./lib/athena");

import {CODES, CHeraErr} from "./lib/Codes";

import {ReHandler} from "./lib/Response";

import {RoleCodeEnum} from "./lib/Consts"


import {MerchantModel} from "./model/MerchantModel";

import {UserModel, PaymentState} from "./model/UserModel";

import {UserBillModel} from "./model/UserBillModel";

import {MSNModel} from "./model/MSNModel";

import {MerchantBillModel,Action} from "./model/MerchantBillModel";

import {UserRecordModel} from "./model/UserRecordModel";

import {Util} from "./lib/Util"


const gamePlatform = "NA"

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
  userName = `${merchantInfo.suffix}_${userName}`;
  let user = new UserModel(requestParams);
  let [userExistError, userInfo] = await user.get({userName});
  if(userExistError) return callback(null, ReHandler.fail(userExistError));
  if(!userInfo) return callback(null, ReHandler.fail(new CHeraErr(CODES.userNotExist)));
  //账号已冻结
  if(userInfo.state == 2) return callback(null, ReHandler.fail(new CHeraErr(CODES.Frozen)));
  //验证密码
  let flag = user.vertifyPassword(userInfo.userPwd);
  
  if(!flag) return callback(null, ReHandler.fail(new CHeraErr(CODES.passwordError)));
  let loginToken = Util.createTokenJWT({userName,suffix:merchantInfo.suffix,userId:userInfo.userId});
  let [updateError] = await user.update({userName: userName},{ token: loginToken,updateAt:Date.now()});
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
    
    let merchantAmount = -action * (+requestParams.amount);

    if(!Object.is(action, 1) && !Object.is(action, -1)){
      return callback(null, ReHandler.fail(new CHeraErr(CODES.DataError)));
    }
    
    
    //获取商家
    let [merError, merchantInfo] = await new MerchantModel().findById(+requestParams.buId);
    if(merError) return callback(null, ReHandler.fail(merError));
    if(!merchantInfo) return callback(null, ReHandler.fail(new CHeraErr(CODES.merchantNotExist)));
    userName = `${merchantInfo.suffix}_${userName}`;
    requestParams.userName = userName;

    if(action == Action.recharge) {
      requestParams.fromRole = RoleCodeEnum.Merchant;
      requestParams.toRole = RoleCodeEnum.Player;
      requestParams.fromUser = merchantInfo.username;
      requestParams.toUser = userName;
    }else {
      requestParams.fromRole = RoleCodeEnum.Player;
      requestParams.toRole = RoleCodeEnum.Merchant;
      requestParams.fromUser = userName;
      requestParams.toUser = merchantInfo.username;
    }

    //检查玩家点数是否足够 如果是玩家提现才检查，充值不需要
    let userBillModel = new UserBillModel(requestParams);
    let [pError, palyerBalance] = await userBillModel.getBalance(); //获取玩家余额
    if(pError) return callback(null, ReHandler.fail(action)); 
    if(action == -1) {
      if(palyerBalance < +requestParams.amount) return callback(null, ReHandler.fail(new CHeraErr(CODES.palyerIns)));
    }

    //获取用户信息
    let u = new UserModel();
    let [getUserError, user] = await u.get({userName});
    if(!user) return callback(null, ReHandler.fail(new CHeraErr(CODES.userNotExist)));
    //玩家是否正在游戏中
    /*
    let gameing = u.isGames(user);
    if(gameing) {
      return callback(null, ReHandler.fail(new CHeraErr(CODES.gameingError)));
    }
    */
    //商户点数变化
    let merchantBillModel = new MerchantBillModel(requestParams);
    merchantBillModel.action = -merchantBillModel.action;
    merchantBillModel.amount = merchantAmount;
    Object.assign(merchantBillModel,{
      userId : merchantInfo.userId
    })
    let [mError, amount] = await merchantBillModel.handlerPoint();
    if(mError) return callback(null, ReHandler.fail(mError));
    //保存玩家账单
    userBillModel.userName = userName;
    userBillModel.userId = user.userId;
    userBillModel.originalAmount = palyerBalance;
    console.log(userBillModel);
    let [saveError] = await userBillModel.save();
    if(saveError) return callback(null, ReHandler.fail(saveError));
    //查账
    let [getError, userSumAmount] = await userBillModel.getBalance();
    if(getError) return callback(null, ReHandler.fail(getError));

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
  let [msnError, merchantInfo] = await msnModel.findMerchantByMsn(msn);
  if(msnError) {
    return callback(null, ReHandler.fail(msnError));
  }
  if(!merchantInfo) {
    return callback(null, ReHandler.fail(new CHeraErr(CODES.merchantNotExist)));
  }
  userName = `${merchantInfo.suffix}_${userName}`; 
  let user = new UserModel(requestParams);
  let [userExistError, userInfo] = await user.get({userName:userName});
  if(userExistError) return callback(null, ReHandler.fail(userExistError));
  if(!userInfo) return callback(null, ReHandler.fail(new CHeraErr(CODES.userNotExist)));
  //账号已冻结
  if(userInfo.state == 2) return callback(null, ReHandler.fail(new CHeraErr(CODES.Frozen)));
  //验证密码
  let flag = user.vertifyPassword(userInfo.userPwd);
  
  if(!flag) return callback(null, ReHandler.fail(new CHeraErr(CODES.passwordError)));
  let suffix = userInfo.userName.split("_")[0];
  let loginToken = Util.createTokenJWT({userName : userInfo.userName, suffix:suffix, userId:+userInfo.userId});
  let [updateError] = await user.update({userName: userInfo.userName},{ token: loginToken,updateAt:Date.now()});
  if(updateError) return callback(null, ReHandler.fail(updateError));

  //获取余额
  let userBill = new UserBillModel(userInfo);
  let [bError, balance] = await userBill.getBalance();
  if(bError) {
    return callback(null, ReHandler.fail(updateError));
  }
  //修改游戏状态（不能进行转账操作）
  /*
  let [upErr] = await user.update({userName:userName},{payState:PaymentState.forbid});
  if(upErr) {
    return callback(null, ReHandler.fail(upErr));
  }
  */
  let callObj = {
    data : {
      token : loginToken,
      balance : balance,
      msn : userInfo.msn,
      createAt : userInfo.createAt,
      updateAt : userInfo.updateAt,
      username : userName.split("_")[0],
      userId : userInfo.userId
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
  //json转换
  let [parserErr, requestParams] = athena.Util.parseJSON(event.queryStringParameters);
  if(parserErr) return callback(null, ReHandler.fail(parserErr));
  //检查参数是否合法
  let [checkAttError, errorParams] = athena.Util.checkProperties([
      {name : "userId", type:"N"}
  ], requestParams);
  let userId = +requestParams.userId;
  //验证token
  let [err, userInfo] = await Util.jwtVerify(event.headers.Authorization);
  if(err ||  !userInfo || !Object.is(userId, userInfo.userId)){
    return callback(null, ReHandler.fail(new CHeraErr(CODES.TokenError)));
  }
  
  let userBill = new UserBillModel(userInfo);
  console.log(typeof +userId);

  let [bError, balance] = await userBill.getBalance();
  if(bError) return callback(null, ReHandler.fail(bError));
  callback(null, ReHandler.success({
      data :{balance : balance}
  }));
}

/**
 * 玩家账单验证
 * @param {*} event 
 * @param {*} context 
 * @param {*} callback 
 */
async function playerRecordValidate(event, context, callback){
  //json转换
  let [parserErr, requestParams] = athena.Util.parseJSON(event.body || {});
  if(parserErr) return callback(null, ReHandler.fail(parserErr));
  
  if(!requestParams.list || requestParams.list.length == 0){
    return;
  }
  let records = requestParams.list || [];
  let userRecordModel = new UserRecordModel({recoreds});
  let [err, valid, settlementInfo] = userRecordModel.validateRecords(records);
  if(err) {
    return callback(null, ReHandler.fail(err));
  }
  //判断转入金额是否和余额一致(还没有写)

  //保存账单信息
  let [saveErr] = userRecordModel.save();
  if(saveErr) {
    return callback(null, ReHandler.fail(saveErr));
  }
  if(!valid) {
    return callback(null, ReHandler.fail(new CHeraErr(CODES.playerRecordError.billNotMatchErr)));
  }

  //更新余额
  callback(null, ReHandler.success({
      data :{balance : balance}
  }));

}

export{
  gamePlayerRegister, //玩家注册
  gamePlayerLogin,    //玩家登陆
  getGamePlayerBalance,  //用户余额
  gamePlayerBalance,  //玩家充值提现
  gamePlayerA3Login, //A3游戏登陆
  getA3GamePlayerBalance, //用户余额（A3）
  playerRecordValidate  //玩家账单验证
}