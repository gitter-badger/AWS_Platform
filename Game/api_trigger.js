import { Success, Fail, Codes, Tables, JwtVerify, JSONParser, RoleCodeEnum } from './lib/all'
import { UserRankStatModel } from './model/UserRankStatModel'
import { UserModel } from './model/UserModel'
const billDetailTrigger = async (e, c, cb) => {
    let betCount = 0
    let winCount = 0
    let lastTime = 0
    let userName = 'NULL!'
    console.log('本次触发开始')
    console.log(JSON.stringify(e.Records))
    console.log('数组长度'+e.Records.length)
    console.log('本次触发结束')
    for (let item of e.Records) {
        let record = item.dynamodb.NewImage
        let type = parseInt(record.type.N)
        let amount = parseFloat(record.amount.N)
        console.log('record:的内容有' + JSON.stringify(record))
        console.log('所有的用户名：' + JSON.stringify(record.userName))
        if (type == 3) {
            userName = record.userName.S
            betCount += Math.abs(parseFloat(amount))
        } else if (type == 4) {
            userName = record.userName.S
            winCount += parseFloat(amount)
        }
    }
    // 根据用户名获取UserId
    let [uerErr, userInfo] = await new UserModel().get({ userName }, ["userId", "nickname", "headPic"])
    //玩家没有登录不进行用户排行榜操作
    if (userInfo && userInfo.nickname && userInfo.nickname != "NULL!") {
        let inparam = { userName: userName, nickname: userInfo.nickname, headPic: userInfo.headPic, userId: parseInt(userInfo.userId), betCount: betCount, winCount: winCount }
        console.log(inparam)
        new UserRankStatModel().insertRank(inparam)
    }
}

export {
    billDetailTrigger   // 玩家流水表触发器
}