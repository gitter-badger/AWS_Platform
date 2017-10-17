import { ResOK, ResErr, JSONParser, BizErr, RoleCodeEnum, Model, Codes, Pick, S3Store$ } from './lib/all'

/**
 * 测试接口
 */
const test = async (e, c, cb) => {
    try {
        return ResOK(cb, { payload: 'test' })
    } catch (error) {
        return ResErr(cb, error)
    }
}

/**
 * 对外方法
 */
export {
    test
}
