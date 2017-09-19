import { Success, Fail, Codes, Tables, JwtVerify, JSONParser,RoleCodeEnum } from './lib/all'


import {PlatformUserModel} from "./model/PlatformUserModel"

import {PlatformBillModel} from "./model/PlatformBillModel"

import {PushModel} from "./model/PushModel"


import {UserModel} from "./model/UserModel"


import {MSNModel} from "./model/MSNModel"

import {UserBillModel} from "./model/UserBillModel"

import {BillStatModel} from "./model/BillStatModel"

import {PlayerModel} from "./model/PlayerModel"

import {TimeUtil}  from "./lib/TimeUtil"

import {TcpUtil} from "./lib/TcpUtil"


const userTrigger = async (e, c, cb) => {
    console.info(e.Records)
    console.info(e.Records[0].dynamodb)
    let record = e.Records[0].dynamodb.Keys;
    console.info(record.userId);
    let userId = record.userId.S;
    console.log("userID:"+userId)
    let userModel = new PlatformUserModel();
    let [error, userInfo] = await userModel.get({userId}, [], "UserIdIndex");
    if(error) {
        return console.info(error);
    }
    if(!userInfo){
        console.info("没有找到用户信息")
        return;
    }
    console.log(userInfo);
    let [msnError, msnInfo] = await new MSNModel().get({userId: userInfo.userId},[], "UserIdIndex");
    msnInfo = msnInfo || {msn:"0"};
    msnInfo.msn = msnInfo.msn || "0";
    let pushModel = new PushModel({
        username : userInfo.username,
        userId :userInfo.userId,
        role : userInfo.role,
        headPic : "NULL!",
        parent : userInfo.parent,
        msn : msnInfo.msn,
        gameList : userInfo.gameList,
        liveMix : userInfo.liveMix || -1,
        vedioMix : userInfo.vedioMix || -1,
        rate : userInfo.rate || -1,
        displayName : userInfo.displayName || "NULL!",
        suffix : userInfo.suffix,
        levelIndex : userInfo.levelIndex+"",
        merUrl : userInfo.frontURL || "-1"
    })
    if(userInfo.role == RoleCodeEnum.SuperAdmin || userInfo.role == RoleCodeEnum.PlatformAdmin || userInfo.role == RoleCodeEnum.Agent) {
        pushModel.gameList = ["10000", "30000","40000"]
    }
    console.log("pushModel");
    console.log(pushModel);
    let [er] = await pushModel.pushMerchant();
    if(er) {
        console.info("推送商户发生错误");
        console.info(er);
    }else {
        console.info("推送商户成功");
    }
}

const playerBalanceTrigger = async(e, c , cb) => {
    console.log(e);
    let record = e.Records[0].dynamodb.Keys;
    console.log(record);
    let userName = record.userName.S;
    let createAt = +record.createAt.N;
    playerBillStat(userName, createAt);
    let playerModel = new PlayerModel();
    let [playErr, playerInfo] = await playerModel.get({userName});
    if(playErr) {
        console.log(playErr);
        return;
    }
    if(!playerInfo) {
        return;
    }
    let userId = playerInfo.userId;
    let pushModel = new PushModel();
    let [er] = await pushModel.pushUserBalance(userId);
    if(er) {
        console.info("玩家余额变更推送失败");
        console.info(er);
    }else {
        console.info("玩家余额变更推送成功");
    }
}
const saveStatRecord = async(userId, role,amount, obj,allUserId) => {
    console.log("账单金额："+amount);
    obj.createdAt = Date.now();
    //天统计
    let todayStr = TimeUtil.formatDay(new Date());

    //获取当天的
    let [getDayErr, dayStat] = await new BillStatModel().get({userId:userId, dateStr : todayStr},[],"userIdAndDate");
    if(getDayErr) {
        return console.log(getDayErr);
    }
    dayStat = dayStat || {amount : 0}
    let billStatModel = new BillStatModel({
        sn : dayStat.sn,
        userId : userId,
        role : role,
        type : 1,
        amount : dayStat.amount+ amount,
        dateStr : todayStr,
        ...obj
    });
    let [daySaveErr] = await billStatModel.save();
    if(daySaveErr) {
        return console.log(daySaveErr);
    }
    
    //获取当月的
    let monthStr = TimeUtil.formatMonth(new Date());
    let [getMonthErr, monthStat] = await new BillStatModel().get({userId:userId, dateStr : monthStr},[],"userIdAndDate");
    if(getMonthErr) {
        return console.log(getMonthErr);
    }
    monthStat = monthStat || {amount:0};
    
    billStatModel = new BillStatModel({
        sn : monthStat.sn,
        userId : userId,
        role : role,
        type :2,
        amount : monthStat.amount + amount,
        dateStr : monthStr,
        ...obj
    });
    let [monthSaveErr] = await billStatModel.save();
    if(monthSaveErr) {
        return console.log(monthSaveErr);
    }
    //所有用户当天的
    let [allUserErr, allUserStat] = await new BillStatModel().get({userId:allUserId, dateStr : todayStr},[],"userIdAndDate");
    if(getDayErr) {
        return console.log(getDayErr);
    }
    console.log("最初余额");
    allUserStat = allUserStat || {amount : 0}
    console.log(allUserStat.amount)
    billStatModel = new BillStatModel({
        sn : allUserStat.sn,
        userId : allUserId,
        role : role,
        type : 3,
        amount : allUserStat.amount+ amount,
        dateStr : todayStr
    });
    console.log(billStatModel);
    let [allUserSaveErr] = await billStatModel.save();
    if(allUserSaveErr) {
        return console.log(daySaveErr);
    }
    
}
const playerBillStat = async(userName, createAt) => {
    let [infoErr, billInfo] = await new UserBillModel().get({userName, createAt});
    if(infoErr) {
        return console.log(infoErr)
    }
    if(!billInfo) {
        console.log("没有找到账单信息");
        return;
    }
    let [userErr, userInfo] = await new PlayerModel().get({userName:userName});
    if(userErr) {
        return console.log(infoErr)
    }
    if(!userInfo) {
        console.log("没有找到用户信息信息");
        return;
    }
    if(billInfo.type == 3 || billInfo.type == 4) {
        let allUserId = userInfo.msn == "000" ? "ALL_AGENT_PLAYER" : "ALL_PLAYER";
        saveStatRecord(billInfo.userId+"", "10000", billInfo.amount,{
            gameType : billInfo.gameType
        }, allUserId);
    }
}
/**
 * 游戏广播推送
 * @param {*} e 
 * @param {*} c 
 * @param {*} cb 
 */
const gameNotice = async(e, c, cb) => {
    console.log(e);
    let record = e.Records[0].dynamodb.Keys;
    console.log(record);
    let noid = record.noid.S;
    let pushModel = new PushModel();
    let [er] = await pushModel.pushGameNotice(noid);
    if(er) {
        console.info("广播推送失败");
        console.info(er);
    }else {
        console.info("广播推送成功");
    }
}
/**
 * 游戏邮件推送
 * @param {*} e 
 * @param {*} c 
 * @param {*} cb 
 */
const gameEmail = async(e, c, cb) => {
    console.log(e);
    let record = e.Records[0].dynamodb.Keys;
    console.log(record);
    let emid = record.emid.S;
    let pushModel = new PushModel();
    let [er] = await pushModel.pushGameEamil(emid);
    if(er) {
        console.info("广播推送失败");
        console.info(er);
    }else {
        console.info("广播推送成功");
    }
}
const gameAdvert = async(e, c, cb) => {
    let pushModel = new PushModel();
    let [er] = await pushModel.pushGameAdvert(1+"");
    if(er) {
        console.info("广告推送失败");
        console.info(er);
    }else {
        console.info("广告推送成功");
    }
}

/**
 * 用户账单
 * @param {*} e 
 * @param {*} c 
 * @param {*} cb 
 */
const userBillTrigger = async(e, c, cb) => {
    console.log(e);
    let record = e.Records[0].dynamodb.Keys;
    let sn = record.sn.S;
    let userId = record.userId.S;
    let platformBillModel = new PlatformBillModel();
    let [getErr, billInfo] = await platformBillModel.get({userId:userId, sn:sn});
    console.log(getErr);
    console.log(billInfo);
    if(getErr) {
        console.log(getErr);
        return;
    }
    if(!billInfo) {
        console.log("账单不存在");
        return;
    }
    let amount = billInfo.amount;
    let [userErr, userInfo] = await new PlatformUserModel().findByUserId(userId);
    if(userErr) {
        console.log(userErr);
        return;
    }
    if(!userInfo) {
        console.log("用户不存在");
        return;
    }
    //退钱不管，只管上级给下级存钱
    if(amount<0 && +billInfo.fromRole < +billInfo.toRole) {  //扣钱(上级给下级存钱)
        saveStatRecord(userId, userInfo.role, billInfo.amount, {}, "ALL_ADMIN");
    }
}

export {
    userTrigger,                     // 用户表触发器
    playerBalanceTrigger,
    gameNotice,
    gameEmail,
    gameAdvert, //广告
    userBillTrigger //用户账单
}