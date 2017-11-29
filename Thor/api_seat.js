import { ResOK, ResErr, Codes, JSONParser, Model, SeatTypeEnum, RoleCodeEnum, BizErr } from './lib/all'

import { LogModel } from './model/LogModel'
import { SeatModel } from './model/SeatModel'

import { SeatCheck } from './biz/SeatCheck'

/**
 * 创建
 */
const seatNew = async (e, c, cb) => {
    try {
        // 入参转换
        const [jsonParseErr, inparam] = JSONParser(e && e.body)
        // 检查参数是否合法
        const [checkAttError, errorParams] = new SeatCheck().check(inparam)
        // 获取令牌，只有管理员有权限
        const [tokenErr, token] = await Model.currentRoleToken(e, RoleCodeEnum['PlatformAdmin'])

        // 业务操作
        const [addInfoErr, addRet] = await new SeatModel().add(inparam)
        // 操作日志记录
        inparam.operateAction = '创建展位'
        inparam.operateToken = token
        new LogModel().addOperate(inparam, addInfoErr, addRet)
        // 返回结果
        if (addInfoErr) { return ResErr(cb, addInfoErr) }
        return ResOK(cb, { payload: addRet })
    } catch (error) {
        return ResErr(cb, error)
    }
}

/**
 * 列表
 */
const seatList = async (e, c, cb) => {
    try {
        // 入参转换
        const [jsonParseErr, inparam] = JSONParser(e && e.body)
        // 检查参数是否合法
        const [checkAttError, errorParams] = new SeatCheck().checkQuery(inparam)
        // 获取令牌，只有管理员有权限
        const [tokenErr, token] = await Model.currentRoleToken(e, RoleCodeEnum['PlatformAdmin'])

        // 业务操作
        const [err, ret] = await new SeatModel().list(inparam)

        // 结果返回
        if (err) { return ResErr(cb, err) }
        return ResOK(cb, { payload: ret })
    } catch (error) {
        return ResErr(cb, error)
    }
}

/**
 * 单个
 */
const seatOne = async (e, c, cb) => {
    try {
        // 入参转换
        const [jsonParseErr, inparam] = JSONParser(e && e.body)
        // 获取令牌，只有管理员有权限
        const [tokenErr, token] = await Model.currentRoleToken(e, RoleCodeEnum['PlatformAdmin'])

        // 业务操作
        const [err, ret] = await new SeatModel().getOne(inparam)

        // 结果返回
        if (err) { return ResErr(cb, err) }
        return ResOK(cb, { payload: ret })
    } catch (error) {
        return ResErr(cb, error)
    }
}

/**
 * 状态变更
 */
const seatChangeStatus = async (e, c, cb) => {
    try {
        // 入参转换
        const [jsonParseErr, inparam] = JSONParser(e && e.body)
        // 检查参数是否合法
        const [checkAttError, errorParams] = new SeatCheck().checkStatus(inparam)
        // 获取令牌，只有管理员有权限
        const [tokenErr, token] = await Model.currentRoleToken(e, RoleCodeEnum['PlatformAdmin'])

        // 业务操作
        const [err, ret] = await new SeatModel().changeStatus(inparam)

        // 操作日志记录
        inparam.operateAction = '展位状态变更'
        inparam.operateToken = token
        new LogModel().addOperate(inparam, err, ret)
        // 结果返回
        if (err) { return ResErr(cb, err) }
        return ResOK(cb, { payload: ret })
    } catch (error) {
        return ResErr(cb, error)
    }
}

/**
 * 更新
 */
const seatUpdate = async (e, c, cb) => {
    try {
        // 入参转换
        const [jsonParseErr, inparam] = JSONParser(e && e.body)
        // 检查参数是否合法
        const [checkAttError, errorParams] = new SeatCheck().checkUpdate(inparam)
        // 获取令牌，只有管理员有权限
        const [tokenErr, token] = await Model.currentRoleToken(e, RoleCodeEnum['PlatformAdmin'])

        // 业务操作
        const [err, ret] = await new SeatModel().update(inparam)

        // 操作日志记录
        inparam.operateAction = '展位更新'
        inparam.operateToken = token
        new LogModel().addOperate(inparam, err, ret)
        // 结果返回
        if (err) { return ResErr(cb, err) }
        return ResOK(cb, { payload: ret })
    } catch (error) {
        return ResErr(cb, error)
    }
}

/**
 * 删除
 */
const seatDelete = async (e, c, cb) => {
    try {
        // 入参转换
        const [jsonParseErr, inparam] = JSONParser(e && e.body)
        //检查参数是否合法
        const [checkAttError, errorParams] = new SeatCheck().checkDelete(inparam)
        // 获取令牌，只有管理员有权限
        const [tokenErr, token] = await Model.currentRoleToken(e, RoleCodeEnum['PlatformAdmin'])

        // 业务操作
        const [err, ret] = await new SeatModel().delete(inparam)

        // 操作日志记录
        inparam.operateAction = '展位删除'
        inparam.operateToken = token
        new LogModel().addOperate(inparam, err, ret)
        // 结果返回
        if (err) { return ResErr(cb, err) }
        return ResOK(cb, { payload: ret })
    } catch (error) {
        return ResErr(cb, error)
    }
}

/**
 * 展位类别
 */
const seatType = async (e, c, cb) => {
    // 身份令牌
    const [tokenErr, token] = await Model.currentToken(e)
    let seatTypeArr = []
    for (let code in SeatTypeEnum) {
        seatTypeArr.push({ 'code': code, 'name': SeatTypeEnum[code] })
    }
    return ResOK(cb, { payload: seatTypeArr })
}

// ==================== 以下为内部方法 ====================

export {
    seatNew,                         // 创建席位
    seatList,                        // 席位列表
    seatOne,                         // 单个席位
    seatUpdate,                      // 更新席位
    seatChangeStatus,                // 席位状态变更
    seatDelete,                      // 席位删除
    seatType                         // 展位列表
}