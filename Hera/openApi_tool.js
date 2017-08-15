
let  athena  = require("./lib/athena");

import {CODES, CHeraErr} from "./lib/Codes";

import {ReHandler} from "./lib/Response";

import {RoleCodeEnum} from "./lib/Consts"


import {ToolModel} from "./model/ToolModel";

import {UserModel, PaymentState} from "./model/UserModel";

import {UserBillModel, Type} from "./model/UserBillModel";

import {MerchantModel} from "./model/MerchantModel";

import {ToolSeatModel} from "./model/ToolSeatModel";

import {UserDiamondBillModel} from "./model/UserDiamondBillModel";

import {Util} from "./lib/Util"


const gamePlatform = "NA"


/**
 * 玩家购买钻石
 * @param {*} event 
 * @param {*} context 
 * @param {*} callback 
 */
async function playerBuyProp(event, context, callback){
  //json转换
  console.log(event);
  let [parserErr, requestParams] = athena.Util.parseJSON(event.body || {});
  if(parserErr) return callback(null, ReHandler.fail(parserErr));
  //检查参数是否合法
  let [checkAttError, errorParams] = athena.Util.checkProperties([
      {name : "userId", type:"N"},
      {name : "num", type:"N"},
      {name : "amount", type:"N"},
      {name : "kindId", type:"S"}
  ], requestParams);
  if(checkAttError){
    Object.assign(checkAttError, {params: errorParams});
    return callback(null, ReHandler.fail(checkAttError));
  } 
  let userId = +requestParams.userId;
  //验证token
  let [err, userInfo] = await Util.jwtVerify(event.headers.Authorization);
  if(err ||  !userInfo || !Object.is(userId, userInfo.userId)){
    return callback(null, ReHandler.fail(new CHeraErr(CODES.TokenError)));
  }
  //变量
  let num = +requestParams.num;
  let amount = + requestParams.amount;
  let kindId = requestParams.kindId;
  let userId = requestParams.userId;

  //获取道具
  let toolSeatModel = new ToolSeatModel();
  let [toolErr, toolInfo] = await toolSeatModel.getDiamonds();
  if(toolErr) {
      return callback(null, ReHandler.fail(toolErr));
  }
  //道具不存在
  if(!toolInfo) {
      return callback(null, ReHandler.fail(new CHeraErr(CODES.toolNotExist)));
  }
  let price = toolInfo.price || 0;
  
  //实际消耗的金额
  let actualDiamonds = (price*num).toFixed(2);
  if(actualDiamonds != amount) {
      return callback(null, ReHandler.fail(new CHeraErr(CODES.amountError)));
  }
  //用户得到的钻石数量
  let diamonds = (toolInfo.num * price* num).toFixed(2);
  //获取用户信息
  let [userError, userModel] = await new UserModel().get({userId},[], "userIdIndex");
  if(userError) {
      return callback(null, ReHandler.fail(userError));
  }
  if(!userModel) {
      return callback(null, ReHandler.fail(new CHeraErr(CODES.userNotExist)));
  }
  //查询商家信息
  let [merError, merchantModel] = await new MerchantModel().findById(+userModel.buId);
  if(merError) {
      return callback(null, ReHandler.fail(merError));
  }
  if(!merchantModel) {
      return callback(null, ReHandler.fail(new CHeraErr(CODES.merchantNotExist)));
  }

  //获取玩家余额
  let userBillModel = new UserBillModel({
    userId : +userId,
    action : -1,
    userName : userModel.userName,
    msn : userInfo.msn,
    fromRole : userModel.role,
    fromUser : userModel.userName,
    merchantName : merchantModel.displayName,
    msn : merchantModel.msn,
    operator : userModel.userName,
    amount : actualAmount,
    kindId : requestParams.kindId,
    tool : toolInfo,
    num : num,
    type : Type.buyTool,
    toolName : toolInfo.toolName,
    remark : `购买${toolInfo.toolName}`
  })

  let [bErr, balance] = await userBillModel.getBalanceByUid(userId);

  if(bErr) {
      return callback(null, ReHandler.fail(new CHeraErr(bErr)));
  }
  //用户余额不足
  if(amount > balance) {
    return callback(null, ReHandler.fail(new CHeraErr(CODES.palyerIns)));
  }

  //查账
  let [oriError, oriSumBalance] = await userBillModel.getBalance();
  if(oriError) {
    return callback(null, ReHandler.fail(oriError));
  }
  userBillModel.originalAmount = oriSumBalance;
  //保存账单
  let [uSaveErr] = await userBillModel.save();
  if(uSaveErr) {
    return callback(null, ReHandler.fail(uSaveErr));
  }

  //用户钻石发生变化
  let userDiamondBillModel = new UserDiamondBillModel({
    userId : userId,
    action :1,
    userName : userModel.userName,
    msn : merchantModel.msn,
    diamonds : diamonds,
    toolId : 1,
    kindId : kindId
  })
  //获取用户钻石
  let [diamondsError, userDiamonds] = await userDiamondBillModel.getBalance();
  if(diamondsError) {
    return callback(null, ReHandler.fail(diamondsError));
  }
  userDiamondBillModel.originalDiamonds = userDiamonds;
  //更新余额
  let u = new UserModel(); 
  let [updatebError] = await u.update({userName:userModel.userName},{balance : oriSumBalance-amount});
  if(updatebError) return callback(null, ReHandler.fail(updatebError));

  //写入钻石账单
  let [saveDiamondError] = await userDiamondBillModel.save();
  callback(null, ReHandler.success({
      data :{balance : oriSumBalance-amount, diamonds: originalDiamonds+diamonds}
  }));
}

/**
 * 道具列表
 * @param {*} event 
 * @param {*} context 
 * @param {*} callback 
 */
async function toolList(event, context, callback) {
  console.log(event);
    //json转换
  let [parserErr, requestParams] = athena.Util.parseJSON(event.queryStringParameters || {});
  if(parserErr) return callback(null, ReHandler.fail(parserErr));
  //验证token
  let [err, userInfo] = await Util.jwtVerify(event.headers.Authorization);
  if(err ||  !userInfo ){
    return callback(null, ReHandler.fail(new CHeraErr(CODES.TokenError)));
  }
  let toolModel = new ToolModel();
  let [toolErr, toolList] = await toolModel.scan();
  if(toolErr) {
      return callback(null, ReHandler.fail(toolErr));
  }
  let returnArr = [];
  toolList.forEach(function(element) {
      let {toolId, price, url , toolName, num, order, img, toolStatus} = element;
      returnArr.push({toolId, price, url, num, toolName, order, img, toolStatus});
  }, this);
  returnArr.sort((a, b) =>  b.order - a.order)
  callback(null, ReHandler.success({list : returnArr}));
}

export{
  playerBuyProp,  //购买道具
  toolList,  //道具列表
}