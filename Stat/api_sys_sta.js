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

import {onlineUser}  from "./lib/TcpUtil"

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
        console.log(1);
        let [currErr, sumTodayPoints] = await salePointsByDate("1",date);
        if(currErr) {
            return errorHandle(callback, ReHandler.fail(checkAttError));
        }
        console.log(2);
        let [sumErr, sumPoints] = await saleSumPoints("1");
        if(sumErr) {
            return errorHandle(callback, ReHandler.fail(sumErr));
        }
        return callback(null, ReHandler.success({oneNum: sumTodayPoints, twoNum:sumPoints}));
      }
      case 2 : {  //收益情况
        let date = TimeUtil.formatDay(new Date());
        //获取当天的售出点数
        console.log(1);
        let [currErr, sumTodayPoints] = await salePointsByDate("10000",date);
        if(currErr) {
            return errorHandle(callback, ReHandler.fail(checkAttError));
        }
        console.log(2);
        let [sumErr, sumPoints] = await saleSumPoints("10000");
        if(sumErr) {
            return errorHandle(callback, ReHandler.fail(sumErr));
        }
        return callback(null, ReHandler.success({oneNum: sumTodayPoints, twoNum:sumPoints}));
      }
      case 3 : {  //玩家总数
        let [sumErr, count] = await new PlayerModel().sumCount();
        if(sumErr) {
            return errorHandle(callback, ReHandler.fail(sumErr));
        }
        let [onLineErr, online] = await onlineUser();
        if(onLineErr) {
            return errorHandle(callback, ReHandler.fail(onLineErr));
        }
        return callback(null, ReHandler.success({oneNum: count, twoNum : online}));
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
        return callback(null, ReHandler.success({oneNum: todayMerchantCount, twoNum:sumCount}));
      }
      default : {
        return callback(null, ReHandler.success({oneNum: 0, twoNum:0}));
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
  let [listErr, list] = await new BillStatModel().findGameConsume(+startTime, +endTime);
  if(listErr) {
    return callback(null, ReHandler.fail(listErr));
  }
  let sum = 0;
  list.forEach((item) => sum+= item.amount);
  let returnObj = {
      sum : sum,
      keys : [], 
      vedio : [],  //真人
      elec : [],    //电子
      store : []   //商店
  };
  for(let i = startTime; i < endTime+24*60*60*1000-1; i+=24*60*60*1000) {
    returnObj.keys.push(TimeUtil.formatDay(startTime));
    returnObj.vedio.push(0);
    returnObj.elec.push(0);
    returnObj.store.push(0);
  }
  list.forEach((item) => {
      let {dateStr, gameType} = item;
      let index = returnObj.keys.indexOf(dateStr);
  })
}

/**
 * 当日售出点数
 */
async function salePointsByDate(role, date){
    let billStatModel = new BillStatModel();
    let [billErr, array] = await billStatModel.get({role:role, dateStr:date},[],"roleDateIndex", true);
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
 * 售出点数总和
 */
async function saleSumPoints(role){
    let billStatModel = new BillStatModel();
    let [billErr, array] = await billStatModel.get({role:role, type:2}, [] ,"roleTypeIndex", true);
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
    overview //总看板
}
