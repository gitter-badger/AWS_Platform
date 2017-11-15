import { Success, Fail, Codes, Tables, JwtVerify, JSONParser, RoleCodeEnum } from './lib/all'
import { UserRankStatModel } from './model/UserRankStatModel'
import { UserModel } from './model/UserModel'
const billDetailTrigger = async (e, c, cb) => {
    let betCount = 0
    let winCount = 0
    let lastTime = 0
    let balance = 0
    let userName = 'NULL!'
    for (let item of e.Records) {
        let record = item.dynamodb.NewImage
        let type = parseInt(record.type.N)
        let amount = parseFloat(record.amount.N)
        let createdAt = parseFloat(record.createdAt.N)
        userName = record.userName.S
        if (type == 3) {
            betCount += Math.abs(parseFloat(amount))
        } else if (type == 4) {
            winCount += parseFloat(amount)
        }
        if (lastTime < createdAt) {
            lastTime = createdAt
            balance = parseFloat(record.balance.N)
        }
    }
    // 根据用户名获取UserId
    let [uerErr, userInfo] = await new UserModel().get({ userName }, ["userId", "nickname", "headPic"])
    //玩家没有登录不进行用户排行榜操作
    if (userInfo.nickname && userInfo.nickname != "NULL!") {
        let inparam = { userName: userName, nickname: userInfo.nickname, headPic: userInfo.headPic, userId: parseInt(userInfo.userId), balance: balance, betCount: betCount, winCount: winCount }
        console.log(inparam)
        new UserRankStatModel().updateRank(inparam)
    }
}

export {
    billDetailTrigger   // 玩家流水表触发器
}