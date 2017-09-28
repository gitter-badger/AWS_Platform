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
  //json转换
  let [parserErr, requestParams] = Util.parseJSON(event.body || {});
  if(parserErr) return cb(null, ReHandler.fail(parserErr));

  let [tokenErr, tokenInfo] = await validateToken(event);
  if(tokenErr) {
      return callback(null, ReHandler.fail(tokenErr));
  }
  //检查参数是否合法
  let [checkAttError, errorParams] = Util.checkProperties([
    {name : "type", type:"N"}  //1,售出情况   2，收益情况  3，玩家数量情况  4，签约情况
  ], requestParams);
  if(checkAttError) {
     Object.assign(checkAttError, {params: params});
     return callback(null, ReHandler.fail(checkAttError));
  }
  let {date, type} = requestParams;
  let {role, userId} = tokenInfo;
  let isAdmin = role == RoleCodeEnum.SuperAdmin || role ==RoleCodeEnum.PlatformAdmin;
  if(role == RoleCodeEnum.SuperAdmin) {
      role = RoleCodeEnum.PlatformAdmin;
  }
  switch(type) {
      case 1 : {
        let date = TimeUtil.formatDay(new Date());
        //获取当天的售出点数
        console.log(role+"     "+date);
        let [currErr, sumTodayPoints] = await salePointsByDate(role, date, isAdmin ? "ALL_ADMIN" : userId);
        if(currErr) {
            return errorHandle(callback, ReHandler.fail(checkAttError));
        }
        let [sumErr, sumPoints] = await saleSumPoints(role ,isAdmin ? "ALL_ADMIN" : userId);
        if(sumErr) {
            return errorHandle(callback, ReHandler.fail(sumErr));
        }
        return callback(null, ReHandler.success({oneNum: -(sumTodayPoints).toFixed(2), twoNum:-(sumPoints).toFixed(2), type:type}));
      }
      case 2 : {  //收益情况
        let uids = [];
        //管理员
        if(isAdmin) uids = ["ALL_PLAYER"];
        //商户
        if(role == RoleCodeEnum.Merchant) uids = [userId];
        //线路商
        if(role == RoleCodeEnum.Manager) {
            uids = await findChildrenMerchant(userId);
            console.log("线路商");
            console.log(uids);
        }
        let date = TimeUtil.formatDay(new Date());
        let [currErr, sumTodayPoints] = await salePointsByDate("10000",date, uids);
        if(currErr) {
            return errorHandle(callback, ReHandler.fail(checkAttError));
        }
        let [sumErr, sumPoints] = await consumeSumPoints("10000", isAdmin? "ALL_PLAYER" : uids);
        if(sumErr) {
            return errorHandle(callback, ReHandler.fail(sumErr));
        }
        return callback(null, ReHandler.success({oneNum: -(sumTodayPoints).toFixed(2), twoNum:-(sumPoints).toFixed(2), type:type}));
      }
      case 3 : {  //玩家总数
        let err, sum =0, buIds = [],online=0;
        if(isAdmin) {
            [err, sum] = await new PlayerModel().sumCount();
            if(err) {
                return errorHandle(callback, ReHandler.fail(err));
            }
        }else {
            if(role == RoleCodeEnum.Merchant) {
                buIds = [userId];
            }
            if(role == RoleCodeEnum.Manager) {
                buIds = await findChildrenMerchant(userId);
            }
            let [err, obj] = await new PlayerModel().statCount(buIds);
            sum = obj.twoNum;
        }
        console.log(buIds);
        if(isAdmin || buIds.length != 0) {
            [err, online] = await onlineUser(buIds);
            if(err) {
                return errorHandle(callback, ReHandler.fail(err));
            }
        }
        return callback(null, ReHandler.success({oneNum : online, twoNum:sum}));
        // if(isAdmin) {
        //     [err, obj] = await new PlayerModel().statCount();
        // }else {
        //     let buIds = [];
        //     if(role == RoleCodeEnum.Merchant) {
        //         buIds = [userId];
        //     }
        //     if(role == RoleCodeEnum.Manager) {
        //         buIds = await findChildrenMerchant(userId);
        //     }
        //     [err, obj] = await new PlayerModel().statCount(buIds);
        // }
        // if(err) {
        //     return errorHandle(callback, ReHandler.fail(err));
        // }
        // obj.type = type;
        // return callback(null, ReHandler.success(obj));
      }
      case 4 : { //签约情况
        let buIds;
        if(role == RoleCodeEnum.Manager) {
            buIds = await findChildrenMerchant(userId);
        }else if(role == RoleCodeEnum.Merchant) {
            return callback(null, ReHandler.success({oneNum: 0, twoNum:0,type:type}));
        }
        let startTime = TimeUtil.getDayFirstTime(new Date());
        let [todayErr, todayMerchantCount] = await new PlatformUserModel().merchantCount(startTime.getTime(), buIds);
        if(todayErr) {
            return errorHandle(callback, ReHandler.fail(todayErr));
        }
        let [sumErr, sumCount] = await new PlatformUserModel().merchantCount(null, buIds);
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

async function validateToken(event){
    const [tokenErr, token] = await Model.currentToken(event);
    if (tokenErr) {
        return [tokenErr,null]
    }
    const [e, tokenInfo] = await JwtVerify(token[1])
    return [e,tokenInfo];
}
async function findChildrenMerchant(userId) {
    //找到该线路商下所有商户
    let [merErr, merchantList] = await new PlatformUserModel().childrenMerchant(userId);
    if(merErr) {
        return null;
    }
    return merchantList.map((item) => item.userId);
}
/**
 * 游戏消耗详情
 * @param {*} event 
 * @param {*} context 
 * @param {*} callback 
 */
const gameConsumeStat = async function(event, context, callback) {
  console.log(event);
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
  let [tokenErr, tokenInfo] = await validateToken(event);
  if(tokenErr) {
      return callback(null, ReHandler.fail(tokenErr));
  }
  let {startTime, endTime} = requestParams;
  let {userId, role} = tokenInfo;
  let listErr, list= [];
  if(role == RoleCodeEnum.SuperAdmin || role == RoleCodeEnum.PlatformAdmin) {  //平台管理员
      [listErr, list] = await new BillStatModel().findGameConsume(+startTime, +endTime,"10000",3,"ALL_PLAYER");
  }else if(role == RoleCodeEnum.Manager){  //线路商
    //找到该线路商下所有商户
    let [merErr, merchantList] = await new PlatformUserModel().childrenMerchant(userId);
    if(merErr) {
        return callback(null, ReHandler.fail(merErr));
    }
    if(merchantList.length > 0) {
        let uids = merchantList.map((item) => item.userId);
        [listErr, list] = await new BillStatModel().findGameConsume(+startTime, +endTime,"10000",1, uids);
    }
  } else if(role == RoleCodeEnum.Merchant) { //商户
    [listErr, list] = await new BillStatModel().findGameConsume(+startTime, +endTime,"10000",1, userId);
  } 
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
  //
  returnObj.vedioSum = +(returnObj.vedioSum).toFixed(2);
  returnObj.elecSum = +(returnObj.elecSum).toFixed(2);
  returnObj.storeSum = +(returnObj.storeSum).toFixed(2);
  returnObj.sum = +(returnObj.sum).toFixed(2);
  filterNumber(returnObj.vedio);
  filterNumber(returnObj.elec);
  filterNumber(returnObj.store);
  callback(null, ReHandler.success({data:returnObj}));
}
function filterNumber(array = []){
    array.forEach((item) => {
        item = +(item).toFixed(2);
    })
}
/**总收益与总消耗
 * @param {*} event 
 * @param {*} context 
 * @param {*} callback 
 */
const consumeAndIncome = async function(event, context, callback) {
  console.log(event);
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

  let [tokenErr, tokenInfo] = await validateToken(event);
  if(tokenErr) {
      return callback(null, ReHandler.fail(tokenErr));
  }
  let {startTime, endTime} = requestParams;
  let {userId, role} = tokenInfo;

  let consumeErr, consumeList = [], saldeErr, saleList = [];
  //游戏消耗
  if(role == RoleCodeEnum.SuperAdmin || role == RoleCodeEnum.PlatformAdmin) {  //平台管理员
    [consumeErr, consumeList] = await new BillStatModel().findGameConsume(+startTime, +endTime, "10000", 3, "ALL_PLAYER");
    //售出点数
  [saldeErr, saleList] = await new BillStatModel().findGameConsume(+startTime, +endTime, "1", 3, "ALL_ADMIN");
  }else if(role == RoleCodeEnum.Manager) {  //线路商
    //找到该线路商下所有商户
    let [merErr, merchantList] = await new PlatformUserModel().childrenMerchant(userId);
    if(merErr) {
        return callback(null, ReHandler.fail(merErr));
    }
    if(merchantList.length > 0) {
        let uids = merchantList.map((item) => item.userId);
        [consumeErr, consumeList] = await new BillStatModel().findGameConsume(+startTime, +endTime,"10000",1, uids);
    }
    //售出点数
  [saldeErr, saleList] = await new BillStatModel().findGameConsume(+startTime, +endTime, "1", 1, userId);
  }else if(role == RoleCodeEnum.Merchant) {  //商户
    [consumeErr, consumeList] = await new BillStatModel().findGameConsume(+startTime, +endTime,"10000",1, userId);
  }
  
  if(consumeErr) {
      return callback(null, ReHandler.fail(consumeErr));
  }
  
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
    filterNumber(returnObj.sale);
  filterNumber(returnObj.consume);
  callback(null, ReHandler.success({data:returnObj}));
}


/**
 * 当日售出点数
 */
async function salePointsByDate(role, date, uids){
    if(typeof uids == "string") uids = [uids];
    let billStatModel = new BillStatModel();
    let [billErr, array] = await billStatModel.get({role:role, dateStr:date},[], "roleDateIndex", true);
    if(billErr) {
        return [billErr, 0]
    }
    let sum = 0;
    array.forEach(function(element) {
        if(uids.indexOf(element.userId)!=-1){
            sum += element.amount;
        }
    }, this);
    return [null, sum];
}

/**
 * 售出点数总和
 */
async function saleSumPoints(role, userId){
    console.log("role:"+role)
    let billStatModel = new BillStatModel();
    let conditions = {
        role : role
    }
    if(role == RoleCodeEnum.SuperAdmin || role == RoleCodeEnum.PlatformAdmin) {
        conditions.type = 3;
    }else {
        conditions.type = 1;
    }
    let [billErr, array] = await billStatModel.get(conditions, [] ,"roleTypeIndex", true);
    if(billErr) {
        return [billErr, 0]
    }
    let sum = 0;
    array.forEach(function(element) {
        if(userId  && element.userId == userId) {
            sum += element.amount;
        }
    }, this);
    return [null, sum];
}
/**
 * 收益点数总和
 */
async function consumeSumPoints(role, userId){
   
    let billStatModel = new BillStatModel();
    let conditions = {
        role : role,
    }
    if(typeof userId == "string") {
        conditions.type = 3;
    }else {
        conditions.type = 1;
    }
    let [billErr, array] = await billStatModel.get(conditions, [] ,"roleTypeIndex", true);
    if(billErr) {
        return [billErr, 0]
    }
    let sum = 0;
    array.forEach(function(element) {
        if(typeof userId == "string") {
            if(userId  && element.userId == userId) {
                sum += element.amount;
            }
        }else {
            if(userId.indexOf(element.userId)!=-1) {
                sum += element.amount;
            }
        }
        
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
    consumeAndIncome, //售出/收益
}
