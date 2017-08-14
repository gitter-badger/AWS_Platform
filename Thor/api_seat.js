import {
    Success,
    Fail,
    Codes,
    JSONParser,
    Model,
    Tables,
    SeatStatusEnum,
    SeatTypeEnum,
    RoleCodeEnum,
    Trim,
    Pick,
    JwtVerify,
    GeneratePolicyDocument,
    BizErr
} from './lib/all'

import { LogModel } from './model/LogModel'
import { SeatModel } from './model/SeatModel'

import { SeatCheck } from './biz/SeatCheck'

const ResOK = (callback, res) => callback(null, Success(res))
const ResFail = (callback, res, code = Codes.Error) => callback(null, Fail(res, code))
const ResErr = (callback, err) => ResFail(callback, { err: err }, err.code)

/**
 * 创建
 */
const seatNew = async (e, c, cb) => {
    // 入参转换
    const res = { m: 'seatNew' }
    const [jsonParseErr, inparam] = JSONParser(e && e.body)
    if (jsonParseErr) {
        return ResErr(cb, jsonParseErr)
    }
    //检查参数是否合法
    let [checkAttError, errorParams] = new SeatCheck().check(inparam)
    if (checkAttError) {
        Object.assign(checkAttError, { params: errorParams })
        return ResErr(cb, checkAttError)
    }
    // 获取令牌，只有管理员有权限
    const [tokenErr, token] = await Model.currentRoleToken(e, RoleCodeEnum['PlatformAdmin'])
    if (tokenErr) {
        return ResErr(cb, tokenErr)
    }
    // 业务操作
    const [addInfoErr, addRet] = await new SeatModel().add(inparam)
    // 操作日志记录
    inparam.operateAction = '创建展位'
    inparam.operateToken = token
    new LogModel().addOperate(inparam, addInfoErr, addRet)
    // 返回结果
    if (addInfoErr) {
        return ResFail(cb, { ...res, err: addInfoErr }, addInfoErr.code)
    }
    return ResOK(cb, { ...res, payload: addRet })
}

/**
 * 列表
 */
const seatList = async (e, c, cb) => {
    // 入参转换
    const res = { m: 'seatList' }
    const [jsonParseErr, inparam] = JSONParser(e && e.body)
    if (jsonParseErr) {
        return ResErr(cb, jsonParseErr)
    }
    // 业务操作
    let [err, ret] = await new SeatModel().list(inparam)
    // 结果返回
    if (err) {
        return ResFail(cb, { ...res, err: err }, err.code)
    }
    return ResOK(cb, { ...res, payload: ret })
}

/**
 * 单个
 */
const seatOne = async (e, c, cb) => {
    const res = { m: 'seatOne' }
    const [jsonParseErr, inparam] = JSONParser(e && e.body)
    if (jsonParseErr) {
        return ResErr(cb, jsonParseErr)
    }
    let [err, ret] = await new SeatModel().getOne(inparam)
    if (err) {
        return ResFail(cb, { ...res, err: err }, err.code)
    }
    return ResOK(cb, { ...res, payload: ret })
}

/**
 * 状态变更
 */
const seatChangeStatus = async (e, c, cb) => {
    // 数据输入，转换，校验
    const res = { m: 'seatChangeStatus' }
    const [jsonParseErr, inparam] = JSONParser(e && e.body)
    if (jsonParseErr) {
        return ResErr(cb, jsonParseErr)
    }
    //检查参数是否合法
    let [checkAttError, errorParams] = new SeatCheck().checkStatus(inparam)
    if (checkAttError) {
        Object.assign(checkAttError, { params: errorParams })
        return ResErr(cb, checkAttError)
    }
    // 获取令牌，只有管理员有权限
    const [tokenErr, token] = await Model.currentRoleToken(e, RoleCodeEnum['PlatformAdmin'])
    if (tokenErr) {
        return ResErr(cb, tokenErr)
    }
    // 业务操作
    const [err, ret] = await new SeatModel().changeStatus(inparam)

    // 操作日志记录
    inparam.operateAction = '展位状态变更'
    inparam.operateToken = token
    new LogModel().addOperate(inparam, err, ret)

    if (err) {
        return ResFail(cb, { ...res, err: err }, err.code)
    } else {
        return ResOK(cb, { ...res, payload: ret })
    }
}

/**
 * 更新
 */
const seatUpdate = async (e, c, cb) => {
    // 数据输入，转换，校验
    const res = { m: 'seatUpdate' }
    const [jsonParseErr, inparam] = JSONParser(e && e.body)
    if (jsonParseErr) {
        return ResErr(cb, jsonParseErr)
    }
    //检查参数是否合法
    let [checkAttError, errorParams] = new SeatCheck().checkUpdate(inparam)
    if (checkAttError) {
        Object.assign(checkAttError, { params: errorParams })
        return ResErr(cb, checkAttError)
    }
    // 获取令牌，只有管理员有权限
    const [tokenErr, token] = await Model.currentRoleToken(e, RoleCodeEnum['PlatformAdmin'])
    if (tokenErr) {
        return ResErr(cb, tokenErr)
    }
    // 业务操作
    const [err, ret] = await new SeatModel().update(inparam)

    // 操作日志记录
    inparam.operateAction = '展位更新'
    inparam.operateToken = token
    new LogModel().addOperate(inparam, err, ret)

    if (err) {
        return ResFail(cb, { ...res, err: err }, err.code)
    } else {
        return ResOK(cb, { ...res, payload: ret })
    }
}

/**
 * 删除
 */
const seatDelete = async (e, c, cb) => {
    // 数据输入，转换，校验
    const res = { m: 'seatDelete' }
    const [jsonParseErr, inparam] = JSONParser(e && e.body)
    if (jsonParseErr) {
        return ResErr(cb, jsonParseErr)
    }
    //检查参数是否合法
    let [checkAttError, errorParams] = new SeatCheck().checkDelete(inparam)
    if (checkAttError) {
        Object.assign(checkAttError, { params: errorParams })
        return ResErr(cb, checkAttError)
    }
    // 获取令牌，只有管理员有权限
    const [tokenErr, token] = await Model.currentRoleToken(e, RoleCodeEnum['PlatformAdmin'])
    if (tokenErr) {
        return ResErr(cb, tokenErr)
    }
    // 业务操作
    const [err, ret] = await new SeatModel().delete(inparam)

    // 操作日志记录
    inparam.operateAction = '展位删除'
    inparam.operateToken = token
    new LogModel().addOperate(inparam, err, ret)

    if (err) {
        return ResFail(cb, { ...res, err: err }, err.code)
    } else {
        return ResOK(cb, { ...res, payload: ret })
    }
}

/**
 * 展位类别
 */
const seatType = async (e, c, cb) => {
    const res = { m: 'seatType' }
    let seatTypeArr = []
    for (let code in SeatTypeEnum) {
        seatTypeArr.push({ 'code': code, 'name': SeatTypeEnum[code] })
    }
    // 全部展位类别
    return ResOK(cb, { ...res, payload: seatTypeArr })

}

// ==================== 以下为内部方法 ====================

/**
  api export
**/
export {
    seatNew,                         // 创建席位
    seatList,                        // 席位列表
    seatOne,                         // 单个席位
    seatUpdate,                      // 更新席位
    seatChangeStatus,                // 席位状态变更
    seatDelete,                      // 席位删除
    seatType                         // 展位列表
}