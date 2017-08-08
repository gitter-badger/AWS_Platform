import { Success, Fail, Codes, Tables, JwtVerify, JSONParser } from './lib/all'
const ResOK = (callback, res) => callback(null, Success(res))
const ResFail = (callback, res, code = Codes.Error) => callback(null, Fail(res, code))

import { UserModel } from './model/UserModel'

// import {PlatformUserModel} from "./model/PlatformUserModel"

// import {PushModel} from "./model/PushModel"

// import {UserModel} from "./model/UserModel"

// import {UserBillModel} from "./model/UserBillModel"

// import {TcpUtil} from "./lib/TcpUtil"


const userTrigger = async (e, c, cb) => {
    // console.info(e.Records)
    // console.info(e.Records[0].dynamodb)
    console.info('test')
    const [queryErr, user] = await new UserModel().queryUserById('de1fb483-5307-4ff9-8009-9a04cffee142')
    console.info('测试')
    console.info(user)

 
   
    // let record = e.Records[0].dynamodb.Keys;
    // let userId = record.userId.S;
    // let userModel = new PlatformUserModel();
    // let [error, userInfo] = await userModel.get({userId}, [], "UserIdIndex");
    // if(error) {
    //     return console.log(error);
    // }
    // if(!userInfo) return;
    
    // let pushModel = new PushModel({
    //     username : userInfo.username,
    //     id :userInfo.userId,
    //     role : userInfo.role,
    //     headPic : "",
    //     parentId : userInfo.parent,
    //     msn : userInfo.msn,
    //     gameList : userInfo.gameList || [],
    //     nickName : userInfo.displayName || ""
    // })
    // let [er] = await pushModel.pushMerchant();
    // if(er) {
    //     console.log("推送商户发生错误");
    //     console.error(er);
    // }else {
    //     console.log("推送商户成功");
    // }
}

const playerBalanceTrigger = async(e, c , cb) =>{
    // let record = e.Records[0].dynamodb.keys;
    // let userId = +record.userId.N;
    // let gameId = record.kindId;
    // let userBillModel = new UserBillModel();
    // let [error, balance] = userBillModel.getBalanceByUid(userId);
    // balance = balance || 0;
    // if(gameId == -1) {
    //     let pushModel = newPushModel({
    //         userId : userId,
    //         balance : balance
    //     })
    //     pushModel.pushUserBalance();
    // } 
}

export {
    userTrigger,                     // 用户表触发器
    playerBalanceTrigger
}