import { Codes, JSONParser, Model, RoleCodeEnum, BizErr } from './lib/all'
import { ConfigModel } from './model/ConfigModel'

import { CODES, CHeraErr } from "./lib/Codes"
import { ReHandler } from "./lib/Response"

/**
 * 单个配置
 */
const sysConfig = async (e, c, cb) => {
    try {
        // 入参转换
        const [jsonParseErr, inparam] = JSONParser(e && e.body)
        // 身份令牌
        // const [tokenErr, token] = await Model.currentToken(e)
        // 业务操作
        const [err, ret] = await new ConfigModel().getOne(inparam)
        // 结果返回
        if (err) { cb(null, ReHandler.fail(err)) }
        cb(null, ReHandler.success({ payload: ret }))
    } catch (error) {
        cb(null, ReHandler.fail(error))
    }
}

// ==================== 以下为内部方法 ====================
export {
    sysConfig                    // 单个配置
}