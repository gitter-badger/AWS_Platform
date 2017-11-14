import { Success, Fail, Codes, Tables, JwtVerify, JSONParser, RoleCodeEnum } from './lib/all'
import { UserRankStatModel } from './model/UserRankStatModel'
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
            betCount += Math.abs(amount)
        } else if (type == 4) {
            winCount += amount
        }
        if (lastTime < createdAt) {
            lastTime = createdAt
            balance = parseFloat(record.balance.N)
        }
        console.log('玩家userName：' + userName + "类型：" + type + "金额：" + amount + "余额：" + balance)
    }
    //更新操作
    let inparam = { userName: userName, balance: balance, betCount: betCount, winCount: winCount }
    new UserRankStatModel().updateRank(inparam)
}

export {
    billDetailTrigger   // 玩家流水表触发器
}