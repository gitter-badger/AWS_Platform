import { ResOK, ResErr, Codes, JSONParser, Model, RoleCodeEnum, BizErr } from './lib/all'
import { UserModel } from './model/UserModel'
/**
 * 查询平台用户统计信息
 */
const queryUserStat = async (e, c, cb) => {
    try {
        // 入参转换
        const [jsonParseErr, inparam] = JSONParser(e && e.body)
        //检查参数是否合法
        // const [checkAttError, errorParams] = new QueryUserStatCheck().check(inparam)
        // 身份令牌
        const [tokenErr, token] = await Model.currentToken(e)
        inparam.token = token
        // 业务操作
        if (inparam.userId) {
            const [err, ret] = await new UserModel().queryOne(inparam) // 查询单个用户统计
            if (err) { return ResErr(cb, err) }
            initValue(ret)
            return ResOK(cb, { payload: ret })
        } else {
            const [err, ret] = await new UserModel().queryChild(inparam) // 查询所有下级用户统计
            if (err) { return ResErr(cb, err) }
            ret.forEach(item => initValue(item))
            return ResOK(cb, { payload: ret })
        }
    } catch (error) {
        console.error(error)
        return ResErr(cb, error)
    }
}
/**
 * 查询玩家用户统计信息
 */
const queryPlayerStat = async (e, c, cb) => {
    try {
        // 入参转换
        const [jsonParseErr, inparam] = JSONParser(e && e.body)
        //检查参数是否合法
        // const [checkAttError, errorParams] = new QueryPlayerStatCheck().check(inparam)
        // 身份令牌
        const [tokenErr, token] = await Model.currentToken(e)
        // 业务操作
        const [err, ret] = await new UserModel().queryChildPlayer(inparam)
        if (err) { return ResErr(cb, err) }
        ret.forEach(item => initValue(item))
        return ResOK(cb, { payload: ret })
    } catch (error) {
        console.error(error)
        return ResErr(cb, error)
    }
}

function initValue(item) {
    item.bet = 0
    item.betCount = 0
    item.winlose = 0
    item.winloseRate = 0
    item.mixAmount = 0
}
// ==================== 以下为内部方法 ====================
export {
    queryUserStat,
    queryPlayerStat
}