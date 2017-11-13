import { Success, Fail, Codes, Tables, JwtVerify, JSONParser, RoleCodeEnum } from './lib/all'
import { UserRankStatModel } from './model/UserRankStatModel'
import { UserModel } from './model/UserModel'
const billDetailTrigger = async (e, c, cb) => {
    let betCount = 0
    let winCount = 0
    let lastTime = 0
    let userName = ''
    let balance = 0
    for (let item of e.Records) {
        let record = item.dynamodb.NewImage
        let type = record.type.N
        let amount = record.amount.N
        let createdAt = record.createdAt.N
        userName = record.userName.S
        if (type == 3) {
            betCount += Math.abs(amount)
        } else if (type == 4) {
            winCount += amount
        }
        if (lastTime < createdAt) {
            lastTime = createdAt
            balance = record.balance.N
        }
        console.log('玩家userName：' + userName + "类型：" + type + "金额：" + amount + "余额：" + balance)
    }
    let [uerErr, userInfo] = await new UserModel().get({ userName }, ["userId"])
    //更新操作
    let inparam = { userId: parseInt(userInfo.userId), balance: parseFloat(balance), betCount: parseFloat(betCount), winCount: parseFloat(winCount) }
    new UserRankStatModel().updateRank(inparam)
}

export {
    billDetailTrigger   // 玩家流水表触发器
}