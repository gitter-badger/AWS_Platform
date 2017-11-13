import { Success, Fail, Codes, Tables, JwtVerify, JSONParser, RoleCodeEnum } from './lib/all'

const billDetailTrigger = async (e, c, cb) => {
    let record = e.Records[0].dynamodb.NewImage
    console.info('接收到的数据')
    console.log(record)
    let type = record.type.N
    let amount = record.amount.N
    let balance = record.balance.N
    console.log("类型：" + type + "金额：" + amount + "余额：" + balance)
}

export {
    billDetailTrigger   // 玩家流水表触发器
}