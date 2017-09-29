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

import {Util} from "./lib/Util"

const userTrigger = async (e, c, cb) => {
    console.info(e.Records)
    console.info(e.Records[0].dynamodb)
    let record = e.Records[0].dynamodb.Keys;
    console.info(record.userId);
    let userId = record.userId.S;
    console.log("userID:"+userId)
    let [er] = await new PushModel().pushMerchant(userId);
    if(er) {
        console.info("推送商户发生错误");
        console.info(er);
    }else {
        console.info("推送商户成功");
    }
    // let userModel = new PlatformUserModel();
    // let [error, userInfo] = await userModel.get({userId}, [], "UserIdIndex");
    // if(error) {
    //     return console.info(error);
    // }
    // if(!userInfo){
    //     console.info("没有找到用户信息")
    //     return;
    // }
    // console.log(userInfo);
    // let [msnError, msnInfo] = await new MSNModel().get({userId: userInfo.userId},[], "UserIdIndex");
    // msnInfo = msnInfo || {msn:"0"};
    // msnInfo.msn = msnInfo.msn || "0";
    // let pushModel = new PushModel({
    //     username : userInfo.username,
    //     userId :userInfo.userId,
    //     role : userInfo.role,
    //     headPic : "NULL!",
    //     parent : userInfo.parent,
    //     msn : msnInfo.msn,
    //     gameList : userInfo.gameList,
    //     liveMix : typeof userInfo.liveMix == "undefined" ? -1 : userInfo.liveMix,
    //     vedioMix : typeof userInfo.vedioMix == "undefined" ? -1 : userInfo.vedioMix,
    //     rate :  typeof userInfo.rate == "undefined" ? -1 : userInfo.rate,
    //     displayName : userInfo.displayName || "NULL!",
    //     suffix : userInfo.suffix,
    //     levelIndex : userInfo.levelIndex + "",
    //     merUrl : userInfo.frontURL || "-1"
    // })
    // if(userInfo.role == RoleCodeEnum.SuperAdmin || userInfo.role == RoleCodeEnum.PlatformAdmin || userInfo.role == RoleCodeEnum.Agent) {
    //     pushModel.gameList = ["10000", "30000","40000"]
    // }
    // console.log("pushModel");
    // console.log(pushModel);
    // let [er] = await pushModel.pushMerchant();
    // if(er) {
    //     console.info("推送商户发生错误");
    //     console.info(er);
    // }else {
    //     console.info("推送商户成功");
    // }
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
async function updateAmount(userId, dateStr,amount, gameType, obj) {
    obj.gameType = gameType;
    function findStat(list){
        let stat = null;
        list.forEach((item) => {
            if(item.gameType == gameType) {
                stat = item;
                return;
            }
        })
        return stat;
    }
    let billStatModel = new BillStatModel({userId:userId, dateStr : dateStr, ...obj});
    let [getErr, statInfoList] = await billStatModel.get({userId:userId, dateStr : dateStr},[], "userIdAndDate", true);
    if(getErr) {
        return [getErr];
    }
    let statInfo = findStat(statInfoList);
    if(!statInfo) {
        let [saveErr] = await billStatModel.save();
        if(saveErr) {
            return [saveErr];
        }
    }else{
        billStatModel.sn = statInfo.sn;
    }
    let [updateErr] = await billStatModel.update({sn:billStatModel.sn}, {
        amount : {"$inc":+amount}
    })
    if(updateErr) {
        return [updateErr];
    }
    return [null]
}
const saveStatRecord = async(userId, role,amount, gameType,obj,allUserId,merchantId) => {
    console.log("账单金额："+amount);
    //天统计
    let todayStr = TimeUtil.formatDay(new Date());
    let [dayErr] = await updateAmount(userId, todayStr, amount, gameType,{
        role : role,
        type : 1,
        ...obj
    });
    console.log("保存天");
    if(dayErr) {
        console.log("保存天错误");
        return console.log(dayErr);
    }
    //月统计
    let monthStr = TimeUtil.formatMonth(new Date());
    let [monthErr] = await updateAmount(userId, monthStr, amount, gameType, {
        role : role,
        type : 2,
        ...obj
    });
    console.log("保存月");
    if(monthErr) {
        console.log("保存月错误");
        return console.log(dayErr);
    }
    if(allUserId) {
        //总统计日统计
        let [sumErr] = await updateAmount(allUserId, todayStr, amount, gameType, {
            role : role,
            type : 3,
            ...obj
        });
        console.log("总统计日统计");
        if(sumErr) {
            console.log("总统计日统计错误");
            return console.log(sumErr);
        }
    }
    if(merchantId) {
        let [merchantErr] = await updateAmount(merchantId, todayStr, amount, gameType,{
            role : role,
            type : 1,
            ...obj
        });
        if(merchantErr) {
            return console.log(merchantErr);
        }
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
        console.log("allUserId:" +allUserId);
        saveStatRecord(billInfo.userId+"", "10000", billInfo.amount, billInfo.gameType, {
            gameType : billInfo.gameType
        }, allUserId, userInfo.parent);
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
    let {amount, fromUser, toUser,fromRole, toRole} = billInfo;
    let [userErr, userInfo] = await new PlatformUserModel().findByUserId(userId);
    if(userErr) {
        console.log(userErr);
        return;
    }
    if(!userInfo) {
        console.log("用户不存在");
        return;
    }
    //找到上下级关系，只有上次给下级存钱才保存
    let [fromUserErr, fromUserInfo] = await new PlatformUserModel().get({username:fromUser,role:fromRole},[], "RoleUsernameIndex");
    if(fromUserErr || !fromUserInfo) {
        return console.log("找来源用户错误:"+fromUserErr);
    }
    let [toUserErr, toUserInfo] = await new PlatformUserModel().get({username:toUser,role:toRole},[], "RoleUsernameIndex");
    if(toUserErr || !toUserInfo) {
        return console.log("找来源用户错误:"+toUserErr);
    }
    let levelArr = toUserInfo.levelIndex.split(",");
    let isAdmin = fromRole == RoleCodeEnum.SuperAdmin || fromRole == RoleCodeEnum.PlatformAdmin;
    let parentUid = levelArr.pop();
    if((parentUid == userId || (isAdmin && parentUid == "01")) && amount < 0) { //只管直属上级对下级存钱
        console.log("是直属");
        let allUserId = isAdmin ? "ALL_ADMIN" : null;
        saveStatRecord(userId, userInfo.role, billInfo.amount, "-1", {}, allUserId);
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