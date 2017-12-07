import { ResOK, ResErr, Codes, JSONParser, Model, RoleCodeEnum, BizErr, JwtVerify } from './lib/all'
import { PlayerBillModel } from './model/PlayerBillModel'
import { SysBillModel } from './model/SysBillModel'
/**
 * 计算玩家流水
 */
const calcPlayerStat = async (e, c, cb) => {
    try {
        // 入参转换
        const [jsonParseErr, inparam] = JSONParser(e && e.body)
        // 检查参数是否合法
        // new UserRankCheck().check(inparam)
        // 身份令牌
        // const [tokenErr, token] = await Model.currentToken(e)
        const [tokenErr, token] = await JwtVerify(e.authorizationToken.split(' ')[1])
        if (tokenErr) { ResErr(cb, tokenErr) }
        // 业务操作
        const [err, ret] = await new PlayerBillModel().calcPlayerStat(inparam)
        // 返回结果
        if (err) { return ResErr(cb, err) }
        return ResOK(cb, { payload: ret })
    } catch (error) {
        console.error(error)
        return ResErr(cb, error)
    }
}
/**
 * 计算用户流水
 */
const calcUserStat = async (e, c, cb) => {
    try {
        // 入参转换
        const [jsonParseErr, inparam] = JSONParser(e && e.body)
        //检查参数是否合法
        // const [checkAttError, errorParams] = new QueryPlayerStatCheck().check(inparam)
        // 身份令牌
        // const [tokenErr, token] = await Model.currentToken(e)
        const [tokenErr, token] = await JwtVerify(e.authorizationToken.split(' ')[1])
        if (tokenErr) { ResErr(cb, tokenErr) }
        // 业务操作
        switch (inparam.role) {
            case '1':
                const [err1, ret1] = await new SysBillModel().calcAdminStat(inparam)
                if (err1) { return ResErr(cb, err1) }
                return ResOK(cb, { payload: ret1 })
                break
            case '10':
                const [err10, ret10] = await new SysBillModel().calcManagerStat(inparam)
                if (err10) { return ResErr(cb, err10) }
                return ResOK(cb, { payload: ret10 })
                break
            case '100':
                const [err100, ret100] = await new SysBillModel().calcMerchantStat(inparam)
                if (err100) { return ResErr(cb, err100) }
                return ResOK(cb, { payload: ret100 })
                break
            case '1000':
                const [err1000, ret1000] = await new SysBillModel().calcAgentStat(inparam)
                if (err1000) { return ResErr(cb, err1000) }
                return ResOK(cb, { payload: ret1000 })
                break
            case '-1000':
                const [err, ret] = await new SysBillModel().calcAgentAdminStat(inparam)
                if (err) { return ResErr(cb, err) }
                return ResOK(cb, { payload: ret })
                break
        }
    } catch (error) {
        console.error(error)
        return ResErr(cb, error)
    }
}

// ==================== 以下为内部方法 ====================
export {
    calcPlayerStat,                      //计算玩家账单
    calcUserStat                         //计算用户账单
}