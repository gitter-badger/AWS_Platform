import { Success, Fail, Codes, Tables, JwtVerify, JSONParser } from './lib/all'
const ResOK = (callback, res) => callback(null, Success(res))
const ResFail = (callback, res, code = Codes.Error) => callback(null, Fail(res, code))

const userTrigger = async (e, c, cb) => {
    console.info('test event')
    console.info(e)
    console.info('test context')
    console.info(c)
    console.info('test dynamodb')
    console.info(JSON.stringify(e.dynamodb))
}

export {
    userTrigger                    // 用户表触发器
}