import { Success, Fail, Codes, Tables, JwtVerify, JSONParser,RoleCodeEnum } from './lib/all'


import {PlatformUserModel} from "./model/PlatformUserModel"

import {PushModel} from "./model/PushModel"


import {UserModel} from "./model/UserModel"


import {MSNModel} from "./model/MSNModel"

import {UserBillModel} from "./model/UserBillModel"

import {PlayerModel} from "./model/PlayerModel"

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
        levelIndex : userInfo.levelIndex+""
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
    console.log("userName: "+ userName);
    let playerModel = new PlayerModel();
    let [playErr, playerInfo] = await playerModel.get({userName});
    if(playErr) {
        console.log(playErr);
        return;
    }
    if(!playerInfo) {
        return;
    }
    console.log(playerInfo);
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

export {
    userTrigger,                     // 用户表触发器
    playerBalanceTrigger,
    gameNotice,
    gameEmail,
    gameAdvert //广告
}