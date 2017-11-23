import { ResOK, ResErr, Codes, JSONParser, Model, SeatTypeEnum, RoleCodeEnum, Trim, Pick, BizErr } from './lib/all'

// import { MysteryCheck } from './biz/MysteryCheck'
import { MysteryModel } from './model/MysteryModel'

/**
 * 大厅推送神秘大奖给平台
 */
const pushMystery = async (e, c, cb) => {
    try {
        // 入参转换
        const [jsonParseErr, inparam] = JSONParser(e && e.body)
        // 检查参数是否合法
        // const [checkAttError, errorParams] = new FetchCheck().checkFetchUser(inparam)
        // 获取令牌，只有管理员有权限
        // const [tokenErr, token] = await Model.currentRoleToken(e, RoleCodeEnum['PlatformAdmin'])

        // 业务操作
        const [err, ret] = await new MysteryModel().add(inparam)
        // 操作日志记录
        // inparam.operateAction = '获取平台用户信息'
        // inparam.operateToken = token
        // new LogModel().addOperate(inparam, addInfoErr, addRet)
        // 返回结果
        if (err) { return ResErr(cb, err) }
        return ResOK(cb, { payload: ret })
    } catch (error) {
        console.error(error)
        return ResErr(cb, error)
    }
}

/**
 * 神秘大奖列表
 */
const mysteryList = async (e, c, cb) => {
    try {
        // 入参转换
        const [jsonParseErr, inparam] = JSONParser(e && e.body)
        // 获取令牌，只有管理员有权限
        const [tokenErr, token] = await Model.currentRoleToken(e, RoleCodeEnum['PlatformAdmin'])
        // 列表页搜索和排序查询
        let [err, ret] = await new MysteryModel().page(inparam)
        // 结果返回
        if (err) { return ResErr(cb, err) }
        return ResOK(cb, { payload: ret })
    } catch (error) {
        console.info(error)
        return ResErr(cb, error)
    }
}

// ==================== 以下为内部方法 ====================

export {
    pushMystery,     // 大厅推送神秘大奖
    mysteryList      // 神秘大奖列表
}