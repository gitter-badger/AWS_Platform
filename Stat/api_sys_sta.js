import {Util} from "./lib/athena";

import {CODES, CHeraErr} from "./biz/Codes"

import {ReHandler, JwtVerify} from "./lib/Response";

import athena from "./lib/athena"

import {PlatformUserModel} from "./model/PlatformUserModel"

import {PlatformBillModel} from "./model/PlatformBillModel"

import {BillStatModel} from "./model/BillStatModel"

import {PlayerModel} from "./model/PlayerModel"

import {RoleCodeEnum} from "./lib/all";

import {TimeUtil}  from "./lib/TimeUtil"


import {Model} from "./lib/Dynamo"

/**
 * 系统总看板
 * @param {*} event 
 * @param {*} context 
 * @param {*} callback 
 */
const overview = async function(event, context, callback) {
  console.log(event);
  const [tokenErr, token] = await Model.currentToken(event);
  if (tokenErr) {
      errorHandle(callback, ReHandler.fail(tokenErr));
  }
//   const [e, tokenInfo] = await JwtVerify(token[1])
//   if(e) {
//     return errorHandle(callback, ReHandler.fail(e));
//   }
  //json转换
  let [parserErr, requestParams] = Util.parseJSON(event.body || {});
  if(parserErr) return cb(null, ReHandler.fail(parserErr));
  //检查参数是否合法
  let [checkAttError, errorParams] = Util.checkProperties([
    {name : "type", type:"N"}  //售出情况   2，收益情况  3，玩家数量情况  4，签约情况
  ], requestParams);
  if(checkAttError) {
     Object.assign(checkAttError, {params: params});
     return callback(null, ReHandler.fail(checkAttError));
  }
  let {date, type} = requestParams;
  switch(type) {
      case 1 : {
        let date = TimeUtil.formatDay(new Date());
        //获取当天的售出点数
        let [currErr, sumTodayPoints] = await salePointsByDate("1",date);
        if(currErr) {
            return errorHandle(callback, ReHandler.fail(checkAttError));
        }
        let [sumErr, sumPoints] = await saleSumPoints("1");
        if(sumErr) {
            return errorHandle(callback, ReHandler.fail(sumErr));
        }
        return callback(null, ReHandler.success({oneNum: -sumTodayPoints, twoNum:-sumPoints, type:type}));
      }
      case 2 : {  //收益情况
        let date = TimeUtil.formatDay(new Date());
        let [currErr, sumTodayPoints] = await salePointsByDate("10000",date, "ALL_PLAYER");
        if(currErr) {
            return errorHandle(callback, ReHandler.fail(checkAttError));
        }
        let [sumErr, sumPoints] = await saleSumPoints("10000");
        if(sumErr) {
            return errorHandle(callback, ReHandler.fail(sumErr));
        }
        return callback(null, ReHandler.success({oneNum: -sumTodayPoints, twoNum:-sumPoints, type:type}));
      }
      case 3 : {  //玩家总数
        let [err, obj] = await new PlayerModel().statCount();
        if(err) {
            return errorHandle(callback, ReHandler.fail(err));
        }
        obj.type = type;
        return callback(null, ReHandler.success(obj));
      }
      case 4 : { //签约情况
        let startTime = TimeUtil.getDayFirstTime(new Date());
        let [todayErr, todayMerchantCount] = await new PlatformUserModel().merchantCount(startTime.getTime());
        if(todayErr) {
            return errorHandle(callback, ReHandler.fail(todayErr));
        }
        let [sumErr, sumCount] = await new PlatformUserModel().merchantCount();
        if(sumErr) {
            return errorHandle(callback, ReHandler.fail(sumErr));
        }
        return callback(null, ReHandler.success({oneNum: todayMerchantCount, twoNum:sumCount, type:type}));
      }
      default : {
        return callback(null, ReHandler.success({oneNum: 0, twoNum:0,type:type}));
      }
  }
}

/**
 * 游戏消耗详情
 * @param {*} event 
 * @param {*} context 
 * @param {*} callback 
 */
const gameConsumeStat = async function(event, context, callback) {
  const [tokenErr, token] = await Model.currentToken(event);
  if (tokenErr) {
      errorHandle(callback, ReHandler.fail(tokenErr));
  }
  let [parserErr, requestParams] = Util.parseJSON(event.body || {});
  if(parserErr) return cb(null, ReHandler.fail(parserErr));
  //检查参数是否合法
  let [checkAttError, errorParams] = Util.checkProperties([
    {name : "startTime", type:"N"},
    {name : "endTime", type:"N"},
  ], requestParams);
  if(checkAttError) {
     Object.assign(checkAttError, {params: params});
     return callback(null, ReHandler.fail(checkAttError));
  }
  let {startTime, endTime} = requestParams;
  let [listErr, list] = await new BillStatModel().findGameConsume(+startTime, +endTime,"10000",3,"ALL_PLAYER");
  if(listErr) {
    return callback(null, ReHandler.fail(listErr));
  }
  let sum = 0;
  list.forEach((item) => sum -= item.amount);
  let returnObj = {
      sum : sum,
      keys : [], 
      vedioSum : 0,
      elecSum : 0,
      storeSum : 0,
      vedio : [],  //真人
      elec : [],    //电子
      store : []   //商店
  };
  for(let i = startTime; i <= endTime; i+=24*60*60*1000) {
    returnObj.keys.push(TimeUtil.formatDay(i));
    returnObj.vedio.push(0);
    returnObj.elec.push(0);
    returnObj.store.push(0);
  }
  list.forEach((item) => {
      let {dateStr, gameType,amount} = item;
      let index = returnObj.keys.indexOf(dateStr);
      if(gameType == "30000") { //真人视讯
        returnObj.vedioSum -= amount;
        returnObj.vedio[index] -= amount
      }
      if(gameType == "40000") { //电子游戏
        returnObj.elecSum -= amount;
        returnObj.elec[index] -= amount
      }
      if(gameType == "-1") { //商城买钻石
        returnObj.storeSum -= amount;
        returnObj.store[index] -= amount
      }
  })
  callback(null, ReHandler.success({data:returnObj}));
}

/**总收益与总消耗
 * @param {*} event 
 * @param {*} context 
 * @param {*} callback 
 */
const consumeAndIncome = async function(event, context, callback) {
  const [tokenErr, token] = await Model.currentToken(event);
  if (tokenErr) {
      errorHandle(callback, ReHandler.fail(tokenErr));
  }
  let [parserErr, requestParams] = Util.parseJSON(event.body || {});
  if(parserErr) return cb(null, ReHandler.fail(parserErr));
  //检查参数是否合法
  let [checkAttError, errorParams] = Util.checkProperties([
    {name : "startTime", type:"N"},
    {name : "endTime", type:"N"},
  ], requestParams);
  if(checkAttError) {
     Object.assign(checkAttError, {params: params});
     return callback(null, ReHandler.fail(checkAttError));
  }
  let {startTime, endTime} = requestParams;

  //游戏消耗
  let [consumeErr, consumeList] = await new BillStatModel().findGameConsume(+startTime, +endTime, "10000", 3, "ALL_PLAYER");
  if(consumeErr) {
      return callback(null, ReHandler.fail(consumeErr));
  }
  //售出点数
  let [saldeErr, saleList] = await new BillStatModel().findGameConsume(+startTime, +endTime, "1", 3, "ALL_ADMIN");
  if(saldeErr) {
      return callback(null, ReHandler.fail(saldeErr));
  }
  let returnObj = {
      keys : [], 
      consume : [],  //收益
      sale : [],    //售出
  };
  for(let i = startTime; i <= endTime; i+=24*60*60*1000) {
    returnObj.keys.push(TimeUtil.formatDay(i));
    returnObj.consume.push(0);
    returnObj.sale.push(0);
  }
  consumeList.forEach((item) => {
      let {dateStr,amount} = item;
      let index = returnObj.keys.indexOf(dateStr);
      returnObj.consume[index] -= amount;
  })
  saleList.forEach((item) => {
      let {dateStr,amount} = item;
      let index = returnObj.keys.indexOf(dateStr);
      returnObj.sale[index] -= amount;
  })
  callback(null, ReHandler.success({data:returnObj}));
}


/**
 * 当日售出点数
 */
async function salePointsByDate(role, date, userId){
    let billStatModel = new BillStatModel();
    let [billErr, array] = await billStatModel.get({role:role, dateStr:date},[], "roleDateIndex", true);
    if(billErr) {
        return [billErr, 0]
    }
    let sum = 0;
    array.forEach(function(element) {
        if(element.type == 3 && element.userId == userId) {
            sum += element.amount;
        }
    }, this);
    return [null, sum];
}

/**
 * 售出点数总和
 */
async function saleSumPoints(role, userId){
    let billStatModel = new BillStatModel();
    let [billErr, array] = await billStatModel.get({role:role, type:2}, [] ,"roleTypeIndex", true);
    if(billErr) {
        return [billErr, 0]
    }
    let sum = 0;
    array.forEach(function(element) {
        // if(userId  && element.userId == userId) {
            sum += element.amount;
        // }
    }, this);
    return [null, sum];
}

/**
 * 当日收益点数,指的是，玩家消费
 */
async function incomePointsByDate(role, date){
    let billStatModel = new BillStatModel();
    let [billErr, array] = await billStatModel.get({role:role, date:date},"" ,"roleDateIndex", true);
    if(billErr) {
        return [billErr, 0]
    }
    let sum = 0;
    array.forEach(function(element) {
        sum += element.amount;
    }, this);
    return [null, sum];
}

/**
 * 收益点数总和
 */
async function incomeSumPoints(role){
    let billStatModel = new BillStatModel();
    let [billErr, array] = await billStatModel.get({role:role, type:2}, "" ,"roleTypeIndex", true);
    if(billErr) {
        return [billErr, 0]
    }
    let sum = 0;
    array.forEach(function(element) {
        sum += element.amount;
    }, this);
    return [null, sum];
}

/**
 * 错误处理
 */
const errorHandle = (cb, error) =>{
  let errObj = {};
    errObj.err = error;
    errObj.code = error.code;
    cb(null, ReHandler.fail(errObj));
}


export{
    overview, //总看板
    gameConsumeStat, //游戏消耗详情
    consumeAndIncome
}
