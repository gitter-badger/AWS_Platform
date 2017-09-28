
let  athena  = require("./lib/athena");

import {CODES, CHeraErr} from "./lib/Codes";

import {ReHandler} from "./lib/Response";

import {RoleCodeEnum,SeatTypeEnum, SeatContentEnum, ToolIdEnum} from "./lib/Consts"


import {ToolModel} from "./model/ToolModel";

import {UserModel, PaymentState} from "./model/UserModel";

import {UserBillModel, Type} from "./model/UserBillModel";

import {MerchantModel} from "./model/MerchantModel";

import {GameModel} from "./model/GameModel";

import {PackageModel} from "./model/PackageModel";

import {ToolSeatModel} from "./model/ToolSeatModel";

import {UserDiamondBillModel} from "./model/UserDiamondBillModel";

import {ToolPackageModel} from "./model/ToolPackageModel";

import {Util} from "./lib/Util"

/**
 * 购买前处理
 * @param {*} event 
 */
async function playerBufBefore(event) {
  //json转换
  console.log(event);
  let [parserErr, requestParams] = athena.Util.parseJSON(event.body || {});
  if(parserErr) return callback(null, ReHandler.fail(parserErr));
  //检查参数是否合法
  let [checkAttError, errorParams] = athena.Util.checkProperties([
      {name : "userId", type:"N"},
      {name : "num", type:"N"},
      {name : "amount", type:"N"},
      {name : "seatId", type:"S"},
      {name : "kindId", type:"S"}
  ], requestParams);
  if(checkAttError){
    Object.assign(checkAttError, {params: errorParams});
    return [checkAttError,null]
  } 
  //变量
  let {userId, num, amount, seatId, kindId} = requestParams;

  //验证token
  let [err, userInfo] = await Util.jwtVerify(event.headers.Authorization);
  if(err ||  !userInfo || !Object.is(userId, userInfo.userId)){
    return [new CHeraErr(CODES.TokenError), null];
  }
  
  //获取展位
  let toolSeatModel = new ToolSeatModel();
  let [toolErr, seatInfo] = await toolSeatModel.get({seatId});
  if(toolErr) {
    return [toolErr, null];
  }
  //展位不存在
  if(!seatInfo) {
    return [new CHeraErr(CODES.seatNotExist), null];
  }
  //展位价格
  let price = seatInfo.price || 0;
  
  //实际消耗的金额
  let actualAmount = +(price*num).toFixed(2);
  //如果实际消耗的金额和前端传入的金额不匹配，视为无效
  if(actualAmount != amount) {
    return [new CHeraErr(CODES.amountError), null];
  }
  //展位内容的类型
  let seatType = seatInfo.contentType;
  //如果展位是道具包
  let toolContent;
  if(seatType == SeatContentEnum.package) {
    //道具包里面的道具内容
    console.log("包");
    toolContent = (seatInfo.content || {}).content || [];
  }else {
    console.log("daoju");
    toolContent = [seatInfo.content];
  }
  toolContent.actualAmount = actualAmount;
  return [null, toolContent, requestParams, userInfo, actualAmount, seatInfo.sum, seatInfo]
}

/**
 * 玩家购买道具
 * @param {*} event 
 * @param {*} context 
 * @param {*} callback 
 */
async function playerBuyProp(event, context, callback) {
  let [beforeErr, toolContent, requestParams, userInfo, actualAmount, propNumber, seatInfo] = await playerBufBefore(event);
  if(beforeErr) {
    return callback(null, ReHandler.fail(beforeErr));
  }
  if(seatInfo.seatType != SeatTypeEnum.tool) {
    return callback(null, ReHandler.fail(new CHeraErr(CODES.notPros)));
  }
 
  let {userId, userName} = userInfo;
  //获取用户信息
  let [userErr, userModel] = await new UserModel().get({userName});
  if(userErr) {
    return callback(null, ReHandler.fail(new CHeraErr(userErr)));
  }
  if(!userModel) {
    return callback(null, ReHandler.fail(new CHeraErr(CODES.userNotExist)));
  }
  //获取玩家N币
  let [diamondErr, diamonds] = await new UserDiamondBillModel({userName}).getBalance();
  if(diamondErr) {
    return callback(null, ReHandler.fail(diamondErr));
  }
  //N币不足
  if(actualAmount > diamonds) {
    return callback(null, ReHandler.fail(new CHeraErr(CODES.DiamondsIns)));
  }
  //用户N币发生变化
  let userDiamondBillModel = new UserDiamondBillModel({
    seatId : requestParams.seatId,
    userId : userId,
    action :-1,
    msn : userModel.msn,
    userName : userName,
    diamonds : -actualAmount,
    toolId : 1,
    kindId : requestParams.kindId
  })

  userDiamondBillModel.originalDiamonds = diamonds;
  let [saveErr] = await userDiamondBillModel.save();
  callback(null, ReHandler.success({
      data :{diamonds: diamonds-actualAmount}
  }));
}

/**
 * 玩家购买N币
 * @param {*} event 
 * @param {*} context 
 * @param {*} callback 
 */
async function playerBuyDiamonds(event, context, callback){
  let [beforeErr, toolContent, requestParams, userInfo, actualAmount, seatNumber, seatInfo] = await playerBufBefore(event);
  if(beforeErr) {
    return callback(null, ReHandler.fail(beforeErr));
  }
  if(seatInfo.seatType != SeatTypeEnum.diamonds) {
    return callback(null, ReHandler.fail(new CHeraErr(CODES.notDiamonds)));
  }
  let packageSumDiamond = 0; //包里面的总数量
  for(let i = 0; i < toolContent.length; i++) {
    let info = toolContent[i];
    packageSumDiamond += +(info.toolNum || 1);
  }
  let {userId, userName} = userInfo;
  //用户得到的N币数量
  let diamonds = +(seatNumber * (+packageSumDiamond)).toFixed(2);
  console.log("用户得到的N币数量");
  console.log(diamonds);
  //获取用户信息
  let [userError, userModel] = await new UserModel().get({userId},[], "userIdIndex");
  if(userError) {
      return callback(null, ReHandler.fail(userError));
  }
  if(!userModel) {
      return callback(null, ReHandler.fail(new CHeraErr(CODES.userNotExist)));
  }
  //判断是否正在游戏中
  let game = new UserModel().isGames(userModel);
  if(game) {
      return callback(null, ReHandler.fail(new CHeraErr(CODES.gameingError)));
  }
  //查询商家信息
  let [merError, merchantModel] = await new MerchantModel().findById(+userModel.buId);
  if(merError) {
      return callback(null, ReHandler.fail(merError));
  }
  if(!merchantModel) {
      return callback(null, ReHandler.fail(new CHeraErr(CODES.merchantNotExist)));
  }
  //获取游戏
  let gameType = -1;
  if(requestParams.kindId!= -1) {
    let [gameError, gameModel] = await new GameModel().findByKindId(requestParams.kindId);
    if(gameError) {
      return callback(null, ReHandler.fail(new CHeraErr(gameError)));
    }
    if(!gameModel) {
      return callback(null, ReHandler.fail(new CHeraErr(CODES.gameNotExist)));
    }
    gameType = gameModel.gameType;
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
    kindId : -3,
    gameType : gameType,
    tool : toolContent,
    seatInfo : seatInfo,
    type : Type.buyTool,
    toolName : toolContent.prop,
    typeName : "商城",
    remark : `购买${seatInfo.prop}`
  })
  let [bErr, balance] = await userBillModel.getBalanceByUid(userId);

  if(bErr) {
      return callback(null, ReHandler.fail(new CHeraErr(bErr)));
  }
  //用户余额不足
  if(actualAmount > balance) {
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

  //用户N币发生变化
  let userDiamondBillModel = new UserDiamondBillModel({
    userId : userId,
    action :1,
    userName : userModel.userName,
    msn : merchantModel.msn || "000",
    diamonds : +diamonds,
    toolId : 1,
    kindId : requestParams.kindId
  })
  //获取用户N币
  let [diamondsError, userDiamonds] = await userDiamondBillModel.getBalance();
  if(diamondsError) {
    return callback(null, ReHandler.fail(diamondsError));
  }
  userDiamondBillModel.originalDiamonds = userDiamonds;
  //更新余额
  let u = new UserModel(); 
  let [updatebError] = await u.update({userName:userModel.userName},{balance : +(oriSumBalance-actualAmount).toFixed(2)});
  if(updatebError) return callback(null, ReHandler.fail(updatebError));
  //写入N币账单
  let [saveDiamondError] = await userDiamondBillModel.save();
  callback(null, ReHandler.success({
      data :{balance : +(oriSumBalance-actualAmount).toFixed(2), diamonds: userDiamonds+diamonds}
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

  let toolModel = new ToolModel();
  let [toolErr, toolList] = await toolModel.scan();
  if(toolErr) {
      return callback(null, ReHandler.fail(toolErr));
  }
  let returnArr = [];
  
  toolList.sort((a, b) =>  b.order - a.order)
  callback(null, ReHandler.success({list : toolList}));
}

/**
 * 展位列表
 * @param {*} event 
 * @param {*} context 
 * @param {*} callback 
 */
async function seatList(event, context, callback) {
  //json转换
  console.log(event);
  let [parserErr, requestParams] = athena.Util.parseJSON(event.queryStringParameters || {});
  if(parserErr) return callback(null, ReHandler.fail(parserErr));
  //检查参数是否合法
  let [checkAttError, errorParams] = athena.Util.checkProperties([
      {name : "type", type:"S"},
  ], requestParams);
  if(checkAttError){
    Object.assign(checkAttError, {params: errorParams});
    return callback(null, ReHandler.fail(checkAttError));
  }
  let {type} = requestParams
  let seatModel = new ToolSeatModel();
  let [scanErr, list] = await seatModel.scan({seatType:type});
  if(scanErr) {
    return callback(null, ReHandler.fail(scanErr));
  }
  list.sort((a, b) =>  b.order - a.order);
  
  callback(null, ReHandler.success({list}));
}

/**
 * 道具包列表
 * @param {*} event 
 * @param {*} context 
 * @param {*} callback 
 */
async function packageList(event, context, callback) {
  let packageModel = new PackageModel();
  let [packageErr, list] = await packageModel.scan();
  if(packageErr) {
    return callback(null, ReHandler.fail(packageErr));
  }
  list.sort((a, b) =>  b.order - a.order);
  callback(null, ReHandler.success({list}));
}

export{
  playerBuyProp,  //购买道具
  playerBuyDiamonds, //购买N币
  toolList,  //道具列表
  seatList,  //展位列表
  packageList, //道具包列表
}