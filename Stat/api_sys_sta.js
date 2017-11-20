import {Util} from "./lib/athena";

import {CODES, CHeraErr} from "./biz/Codes"

import {ReHandler, JwtVerify} from "./lib/Response";

import athena from "./lib/athena"

import {PlatformUserModel} from "./model/PlatformUserModel"

import {PlatformBillModel} from "./model/PlatformBillModel"
const uid = require('uuid/v4');

import {BillStatModel} from "./model/BillStatModel"

import {UserBillModel} from "./model/UserBillModel"


import {PlayerModel} from "./model/PlayerModel"

import {RoleCodeEnum} from "./lib/all";

import {TimeUtil}  from "./lib/TimeUtil"

import {onlineUser}  from "./lib/TcpUtil"


import {Model} from "./lib/Dynamo"

/**
 * 初始看板
 * 1,找到所有用户账单
 * 2,找到所有管理员账单
 * @param {*} event 
 * @param {*} context 
 * @param {*} callback 
 */
const init = async function(event, context, callback) {
    let  allStatArr = [],userInfoObj = {},platUserObj= {},platUserRoleObj = {};
    let [playerBillListErr, playerBillList] = await new UserBillModel().scan({});
    console.log(playerBillList.length);
    if(playerBillListErr) {
        console.log("玩家账单列表失败:");
        console.log(playerBillListErr);
    }
    
    for(let i = 0; i < playerBillList.length; i++) {
        let playerBillItem = playerBillList[i];
        if(playerBillItem.type== 3 || playerBillItem.type ==4) {
            let parentId = userInfoObj[playerBillItem.userName];
            if(!parentId) {
                let [userErr, userInfo] = await new PlayerModel().get({userName:playerBillItem.userName});
                if(userErr || !userInfo) {
                    console.log("没有找到用户上级:"+playerBillItem.userName);
                    continue;
                }
                parentId = userInfo.parent;
                userInfoObj[playerBillItem.userName] = parentId;
            }
            pushStat(allStatArr, playerBillItem, parentId, "10000",false, 1);
            let allUserId = playerBillItem.msn == "000" ? "ALL_AGENT_PLAYER" : "ALL_PLAYER";
            pushStat(allStatArr, playerBillItem, allUserId, "10000", false, 3);
        }
    }
    console.log("玩家报表处理成功，准备处理平台用户报表");
    // 用户账单表
    let [userBillListErr, userBillList] = await new PlatformBillModel().scan({});
    if(userBillListErr) {
        console.log("平台用户账单列表失败:");
        console.log(userBillListErr);
    }
    console.log(userBillList.length);
    for(let i = 0; i < userBillList.length; i++) {
        console.log(i);
        let billInfo = userBillList[i];
        let {amount, fromUser, toUser,fromRole, toRole, userId} = billInfo;
        let platUserInfo = platUserObj[userId];
        if(!platUserInfo) {
            let [userErr, p] = await new PlatformUserModel().findByUserId(userId);
            if(userErr || !p) {
                console.log("查找用户信息失败:"+userErr);
                continue;
            }
            platUserInfo = p;
            platUserObj[userId] = platUserInfo;
        }
        
        //找到上下级关系，只有上次给下级存钱才保存
        let toUserInfo = platUserRoleObj[toUser+"-"+toRole];
        if(!toUserInfo) {
            let [toUserErr, t] = await new PlatformUserModel().get({username:toUser,role:toRole},[], "RoleUsernameIndex");
            if(toUserErr || !t) {
                console.log("找目标用户错误:"+toUserErr);
                continue;
            }
            platUserRoleObj[toUser+"-"+toRole] = toUserInfo = t;
        }
        
        if(toUserInfo) {
            let levelArr = toUserInfo.levelIndex.split(",");
            let isAdmin = fromRole == RoleCodeEnum.SuperAdmin || fromRole == RoleCodeEnum.PlatformAdmin;
            let isAgentAdmin = fromRole == RoleCodeEnum.Agent;
            let parentUid = levelArr.pop();
            if((parentUid == userId || (isAdmin && parentUid == "01") || (isAgentAdmin && parentUid == "01") ) && amount < 0) { //只管直属上级对下级存钱
                let allUserId = null;
                if(isAdmin) {
                    allUserId = "ALL_ADMIN"
                }
                if(isAgentAdmin) {
                    allUserId = "ALL_AGENT_ADMIN"
                }
                pushStat(allStatArr, billInfo, userId, platUserInfo.role, false, 1);
                pushStat(allStatArr, billInfo, userId, platUserInfo.role,true, 2);
                if(allUserId) {
                    pushStat(allStatArr, billInfo, allUserId, platUserInfo.role, false, 3);
                }
            }
        }
    }
    //批量写入
    console.log(allStatArr.length);
    // console.log(allStatArr);
    new BillStatModel().batchWrite(allStatArr);
    /**
     * 
     * @param {*} array  所有账单拼接
     * @param {*} userId 
     * @param {*} billItem 比较账单
     */
    function findStat(array, userId, billItem, month) {
        for(let i = 0; i < array.length; i ++) {
            let item = array[i];
            if(item.userId == userId 
                && item.dateStr == (month ? TimeUtil.formatMonth(billItem.createAt || billItem.createdAt) :TimeUtil.formatDay(billItem.createAt || billItem.createdAt))
                && item.gameType == billItem.gameType) {
                return item;
            }
        }
        return null;
    }

    function pushStat(array, billItem,userId, role,month, type) {
        let oriItem = findStat(array, userId, billItem,month);
        if(!oriItem) {
            array.push({
                sn : uid(),
                createdAt : Date.now(),
                createdDate : TimeUtil.formatFillDay(Date.now()),
                dateStr : month ? TimeUtil.formatMonth(billItem.createAt || billItem.createdAt) :TimeUtil.formatDay(billItem.createAt || billItem.createdAt),
                amount : billItem.amount,
                role : role,
                type : type,
                gameType : billItem.gameType || -1,
                userId : userId,
            })
        }else {
            oriItem.amount += +(billItem.amount.toFixed(2));
            oriItem.amount = +(oriItem.amount).toFixed(2);
        }
    }
    // console.log(allStatArr);
    console.log(allStatArr.length);
}

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
      console.log("验证token错误");
      return errorHandle(callback, tokenErr);
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
  let isAgentAdmin = role == RoleCodeEnum.Agent && tokenInfo.parent == "00";
  let isAgent = role == RoleCodeEnum.Agent && tokenInfo.parent != "00";
  let allUserId = "ALL_ADMIN";
  if(isAgentAdmin) allUserId = "ALL_AGENT_ADMIN";
  if(role == RoleCodeEnum.SuperAdmin) {
      role = RoleCodeEnum.PlatformAdmin;
  }
  switch(type) {
      case 1 : {
        let date = TimeUtil.formatDay(new Date());
        //获取当天的售出点数
        let [currErr, sumTodayPoints] = await salePointsByDate(role, date, (isAdmin || isAgentAdmin) ? allUserId : userId);
        if(currErr) {
            return errorHandle(callback, checkAttError);
        }
        let [sumErr, sumPoints] = await saleSumPoints(role ,(isAdmin || isAgentAdmin) ? allUserId : userId, isAgentAdmin);
        if(sumErr) {
            return errorHandle(callback, sumErr);
        }
        return callback(null, ReHandler.success({oneNum: -(sumTodayPoints).toFixed(2), twoNum:-(sumPoints).toFixed(2), type:type}));
      }
      case 2 : {  //收益情况
        let uids = [];
        //管理员
        if(isAdmin) uids = "ALL_PLAYER";
        if(isAgentAdmin) uids = "ALL_AGENT_PLAYER";
        //商户
        if(role == RoleCodeEnum.Merchant) uids = [userId];
        //线路商
        if(role == RoleCodeEnum.Manager || isAgent) {
            uids = await findChildrenMerchant(userId);
            console.log("线路商");
            console.log(uids);
        }
        let date = TimeUtil.formatDay(new Date());
        let [currErr, sumTodayPoints] = await salePointsByDate("10000",date, uids);
        if(currErr) {
            return errorHandle(callback, checkAttError);
        }
        let [sumErr, sumPoints] = await consumeSumPoints("10000",  uids);
        if(sumErr) {
            return errorHandle(callback, sumErr);
        }
        return callback(null, ReHandler.success({oneNum: -(sumTodayPoints).toFixed(2), twoNum:-(sumPoints).toFixed(2), type:type}));
      }
      case 3 : {  //玩家总数
        let err, sum =0, buIds = [],online=0;
        if(isAdmin) {
            [err, sum] = await new PlayerModel().sumCount();
            if(err) {
                return errorHandle(callback, err);
            }
        }else if(isAgentAdmin){
            [err, sum] = await new PlayerModel().agentCount();
            if(err) {
                return errorHandle(callback, err);
            }
        }else {
            if(role == RoleCodeEnum.Merchant || role == RoleCodeEnum.Agent) {
                buIds = [userId];
            } else {
                buIds = await findChildrenMerchant(userId); 
            }
            let [err, obj] = await new PlayerModel().statCount(buIds);
            sum = obj.twoNum;
        }
        console.log(buIds);
        if(isAdmin || isAgentAdmin || buIds.length != 0) {
            if(isAdmin) buIds= ["0"];
            if(isAgentAdmin) buIds = ["1"];
            [err, online] = await onlineUser(buIds);
            if(err) {
                return errorHandle(callback, err);
            }
        }
        return callback(null, ReHandler.success({oneNum : online, twoNum:sum}));
      }
      case 4 : { //签约情况
        let buIds;
        if(role == RoleCodeEnum.Manager || isAgent) {
            buIds = await findChildrenMerchant(userId);
        }else if(role == RoleCodeEnum.Merchant) {
            return callback(null, ReHandler.success({oneNum: 0, twoNum:0,type:type}));
        }
        let startTime = TimeUtil.getDayFirstTime(new Date());
        let queryRole = role == RoleCodeEnum.Agent ? RoleCodeEnum.Agent : RoleCodeEnum.Merchant;
        let [todayErr, todayMerchantCount] = await new PlatformUserModel().merchantCount(startTime.getTime(), buIds, role);
        if(todayErr) {
            return errorHandle(callback, todayErr);
        }
        let [sumErr, sumCount] = await new PlatformUserModel().merchantCount(null, buIds, role);
        if(sumErr) {
            return errorHandle(callback, sumErr);
        }
        return callback(null, ReHandler.success({oneNum: todayMerchantCount, twoNum:sumCount, type:type}));
        }
        default : {
            return callback(null, ReHandler.success({oneNum: 0, twoNum:0,type:type}));
        }
  }
}

async function validateToken(event){
    try{
        const [tokenErr, token] = await Model.currentToken(event);
        if (tokenErr) {
            return [tokenErr,null]
        }
        console.log("过期时间正确");
        console.log(token);
        // const [e, tokenInfo] = await JwtVerify(token[1])
        return [null,token];
    }catch(err) {
        console.log("错误");
        console.log(err);
        return [err];
    }
    
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
      return errorHandle(callback, tokenErr);
  }
  let {startTime, endTime} = requestParams;
  let {userId, role} = tokenInfo;
  let listErr, list= [];
  let isAgentAdmin = role == RoleCodeEnum.Agent && tokenInfo.parent == "00";
  let isAgent = role == RoleCodeEnum.Agent && tokenInfo.parent != "00";
  let queryAllUserId = "ALL_PLAYER";
  if(isAgentAdmin) queryAllUserId = "ALL_AGENT_PLAYER";
  if(role == RoleCodeEnum.SuperAdmin || role == RoleCodeEnum.PlatformAdmin || isAgentAdmin) {  //平台管理员, 代理管理员
      [listErr, list] = await new BillStatModel().findGameConsume(+startTime, +endTime,"10000",3,queryAllUserId);
  }else if(role == RoleCodeEnum.Manager || isAgent){  //线路商，代理
    //找到该线路商下所有商户
    let [merErr, merchantList] = await new PlatformUserModel().childrenMerchant(userId);
    if(merErr) {
        return errorHandle(null, merErr);
    }
    if(merchantList.length > 0) {
        let uids = merchantList.map((item) => item.userId);
        [listErr, list] = await new BillStatModel().findGameConsume(+startTime, +endTime,"10000",1, uids);
    }
  } else if(role == RoleCodeEnum.Merchant) { //商户
    [listErr, list] = await new BillStatModel().findGameConsume(+startTime, +endTime,"10000",1, userId);
  } 
  if(listErr) {
      return errorHandle(null, listErr);
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
      if(gameType == "-1") { //商城买N币
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
    for(var i = 0;i < array.length; i ++) {
        array[i] = +(array[i]).toFixed(2);
    }
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
      return errorHandle(null, tokenErr);
  }
  let {startTime, endTime} = requestParams;
  let {userId, role} = tokenInfo;

  let consumeErr, consumeList = [], saldeErr, saleList = [];
  let isAgentAdmin = role == RoleCodeEnum.Agent && tokenInfo.parent == "00";
  let isAgent = role == RoleCodeEnum.Agent && tokenInfo.parent != "00";
  let queryAllUserId = "ALL_PLAYER";
  let queryAllAdmin = "ALL_ADMIN";
  let queryRole = "1";
  if(isAgentAdmin){
       queryAllUserId = "ALL_AGENT_PLAYER";
       queryAllAdmin = "ALL_AGENT_ADMIN";
       
  }
  if(isAgentAdmin || isAgent) {
      queryRole = "1000"
  }
  //游戏消耗
  if(role == RoleCodeEnum.SuperAdmin || role == RoleCodeEnum.PlatformAdmin || isAgentAdmin) {  //平台管理员
    [consumeErr, consumeList] = await new BillStatModel().findGameConsume(+startTime, +endTime, "10000", 3, queryAllUserId);
    //售出点数
    [saldeErr, saleList] = await new BillStatModel().findGameConsume(+startTime, +endTime, queryRole, 3, queryAllAdmin);
  }else if(role == RoleCodeEnum.Manager || isAgent) {  //线路商
    //找到该线路商下所有商户
    let [merErr, merchantList] = await new PlatformUserModel().childrenMerchant(userId);
    if(merErr) {
        return errorHandle(null, merErr);
    }
    if(merchantList.length > 0) {
        let uids = merchantList.map((item) => item.userId);
        [consumeErr, consumeList] = await new BillStatModel().findGameConsume(+startTime, +endTime,"10000",1, uids);
    }
    //售出点数
    [saldeErr, saleList] = await new BillStatModel().findGameConsume(+startTime, +endTime, queryRole, 1, userId);
  }else if(role == RoleCodeEnum.Merchant) {  //商户
    [consumeErr, consumeList] = await new BillStatModel().findGameConsume(+startTime, +endTime,"10000",1, userId);
  }
  
  if(consumeErr) {
      return errorHandle(null, consumeErr);
  }
  
  if(saldeErr) {
      return errorHandle(null, saldeErr);
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
      returnObj.consume[index] -= +(amount.toFixed(2));
  })
  saleList.forEach((item) => {
      let {dateStr,amount} = item;
      let index = returnObj.keys.indexOf(dateStr);
      returnObj.sale[index] -= +(amount.toFixed(2));
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
async function saleSumPoints(role, userId, isAgentAdmin){
    console.log("role:"+role)
    let billStatModel = new BillStatModel();
    let conditions = {
        role : role
    }
    if(role == RoleCodeEnum.SuperAdmin || role == RoleCodeEnum.PlatformAdmin || isAgentAdmin) {
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
                sum += +(element.amount.toFixed(2));
            }
        }else {
            if(userId.indexOf(element.userId)!=-1) {
                sum += +(element.amount.toFixed(2));
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
    init
}
