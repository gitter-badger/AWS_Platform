import { Success, Fail, Codes, Tables, JwtVerify, JSONParser } from './lib/all'


import {PlatformUserModel} from "./model/PlatformUserModel"

import {PushModel} from "./model/PushModel"


import {UserModel} from "./model/UserModel"


import {MSNModel} from "./model/MSNModel"

import {UserBillModel} from "./model/UserBillModel"

import {TcpUtil} from "./lib/TcpUtil"


const userTrigger = async (e, c, cb) => {
    console.info(e.Records)
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
    let [msnError, msnInfo] = await new MSNModel().get({userId: userInfo.userId},[], "UserIdIndex");
    msnInfo = msnInfo || {msn:"-1"};
    let pushModel = new PushModel({
        username : userInfo.username,
        userId :userInfo.userId,
        role : userInfo.role,
        headPic : "",
        parent : userInfo.parent,
        msn : msnInfo.msn,
        gameList : userInfo.gameList || [],
        displayName : userInfo.displayName || ""
    })
    let [er] = await pushModel.pushMerchant();
    if(er) {
        console.info("推送商户发生错误");
        console.info(er);
    }else {
        console.info("推送商户成功");
    }
}

const playerBalanceTrigger = async(e, c , cb) =>{
    let record = e.Records[0].dynamodb.keys;
    let userId = +record.userId.N;
    let userBillModel = new UserBillModel();
    let [error, balance] = userBillModel.getBalanceByUid(userId);
    console.log("玩家余额:" +balance);
    balance = balance || 0;
    if(gameId == -1) {
        let pushModel = new PushModel({
            userId : userId,
            balance : balance
        })
        pushModel.pushUserBalance();
    }
}


export {
    userTrigger,                     // 用户表触发器
    playerBalanceTrigger
}