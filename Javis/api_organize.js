import { ResOK, ResFail, ResErr, JSONParser, BizErr, RoleCodeEnum, Model, Codes, Pick } from './lib/all'
import { UserModel } from './model/UserModel'

/**
 * 组织架构
 */
const organize = async (e, c, cb) => {
    try {
        const res = { m: 'organize' }
        // 入参转换和校验
        const [jsonParseErr, inparam] = JSONParser(e && e.body)
        // 身份令牌
        const [tokenErr, token] = await Model.currentToken(e)
        // 业务操作
        inparam.token = token
        const [queryErr, queryRet] = await new UserModel().organize(inparam)
        // 结果返回
        if (queryErr) { return ResFail(cb, { ...res, err: queryErr }, queryErr.code) }
        return ResOK(cb, { ...res, payload: queryRet })
    } catch (error) {
        return ResErr(cb, error)
    }
}

// ==================== 以下为内部方法 ====================

export {
    organize                     // 组织架构
}
