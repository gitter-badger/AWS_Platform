import { Success, Fail, Codes, Tables, JwtVerify, JSONParser, RoleCodeEnum } from './lib/all'
import { UserRankStatModel } from './model/UserRankStatModel'
const billDetailTrigger = async (e, c, cb) => {
    let betCount = 0
    let winCount = 0
    let lastTime = 0
    let userId = 0
    console.log(e.Records[0])
    for (let item of e.Records) {
        let record = item.dynamodb.NewImage
        console.info('接收到的数据')
        let type = record.type.N
        let amount = record.amount.N
        let balance = record.balance.N
        let createdAt = record.createdAt
        userId = record.userId.N
        if (type == 3) {
            betCount += Math.abs(amount)
        } else if (type == 4) {
            winCount += amount
        }
        if (lastTime < createdAt) {
            lastTime = createdAt
            balance = record.balance
        }
        console.log('玩家id：' + userId + "类型：" + type + "金额：" + amount + "余额：" + balance)
    }
    //更新操作
    let inparam = { userId: userId, balance: balance, betCount: betCount, winCount: winCount }
    new UserRankStatModel().updatRank(inparam)
}

export {
    billDetailTrigger   // 玩家流水表触发器
}