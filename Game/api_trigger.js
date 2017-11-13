import { Success, Fail, Codes, Tables, JwtVerify, JSONParser,RoleCodeEnum } from './lib/all'

const billDetailTrigger = async (e, c, cb) => {
    console.info(e.Records)
    console.info(e.Records[0].dynamodb)
    let record = e.Records[0].dynamodb.Keys
    console.info(record.userId)
    let userId = record.userId.S
    console.log("userID:"+userId)
}

export {
    billDetailTrigger   // 玩家流水表触发器
}