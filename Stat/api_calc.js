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
        const [tokenErr, token] = await JwtVerify(e.headers.Authorization.split(' ')[1])
        if (tokenErr) { ResErr(cb, tokenErr) }
        if (!token || !token.iat) { ResErr(cb, BizErr.TokenExpire()) }
        // 判断TOKEN是否太老（大于24小时）
        if (Math.floor((new Date().getTime() / 1000)) - token.iat > 86400) {
            return ResErr(cb, BizErr.TokenExpire())
        }
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
        const [tokenErr, token] = await JwtVerify(e.headers.Authorization.split(' ')[1])
        if (tokenErr) { ResErr(cb, tokenErr) }
        if (!token || !token.iat) { ResErr(cb, BizErr.TokenExpire()) }
        // 判断TOKEN是否太老（大于24小时）
        if (Math.floor((new Date().getTime() / 1000)) - token.iat > 86400) {
            return ResErr(cb, BizErr.TokenExpire())
        }
        // 业务操作
        switch (inparam.role) {
            case '1':
                const [err1, ret1] = await new SysBillModel().calcAdminStat(inparam)
                if (err1) { return ResErr(cb, err1) }
                let filterRes1 = []
                for (let item of ret1) {
                    if (item.betCount > 0) {
                        filterRes1.push(item)
                    }
                }
                return ResOK(cb, { payload: filterRes1 })
                break
            case '10':
                const [err10, ret10] = await new SysBillModel().calcManagerStat(inparam)
                if (err10) { return ResErr(cb, err10) }
                let filterRes10 = []
                for (let item of ret10) {
                    if (item.betCount > 0) {
                        filterRes10.push(item)
                    }
                }
                return ResOK(cb, { payload: filterRes10 })
                break
            case '100':
                const [err100, ret100] = await new SysBillModel().calcMerchantStat(inparam)
                if (err100) { return ResErr(cb, err100) }
                let filterRes100 = []
                for (let item of ret100) {
                    if (item.betCount > 0) {
                        filterRes100.push(item)
                    }
                }
                return ResOK(cb, { payload: filterRes100 })
                break
            case '1000':
                const [err1000, ret1000] = await new SysBillModel().calcAgentStat(inparam)
                if (err1000) { return ResErr(cb, err1000) }
                let filterRes1000 = []
                for (let item of ret1000) {
                    if (item.betCount > 0) {
                        filterRes1000.push(item)
                    }
                }
                return ResOK(cb, { payload: filterRes1000 })
                break
            case '-1000':
                const [err, ret] = await new SysBillModel().calcAgentAdminStat(inparam)
                if (err) { return ResErr(cb, err) }
                let filterRes = []
                for (let item of ret) {
                    if (item.betCount > 0) {
                        filterRes.push(item)
                    }
                }
                return ResOK(cb, { payload: filterRes })
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