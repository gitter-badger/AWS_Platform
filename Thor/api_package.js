import {
    Success,
    Fail,
    Codes,
    JSONParser,
    Model,
    Tables,
    StatusEnum,
    PackageStatusEnum,
    GenderEnum,
    RoleCodeEnum,
    RoleEditProps,
    Trim,
    Pick,
    JwtVerify,
    GeneratePolicyDocument,
    BizErr
} from './lib/all'

import { LogModel } from './model/LogModel'
import { PackageModel } from './model/PackageModel'

import { PackageCheck } from './biz/PackageCheck'

const ResOK = (callback, res) => callback(null, Success(res))
const ResFail = (callback, res, code = Codes.Error) => callback(null, Fail(res, code))
const ResErr = (callback, err) => ResFail(callback, { err: err }, err.code)

/**
 * 创建道具包
 */
const packageNew = async (e, c, cb) => {
    // 入参转换
    const res = { m: 'packageNew' }
    const [jsonParseErr, inparam] = JSONParser(e && e.body)
    if (jsonParseErr) {
        return ResErr(cb, jsonParseErr)
    }
    //检查参数是否合法
    let [checkAttError, errorParams] = new PackageCheck().check(inparam)
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
    const [addInfoErr, addRet] = await new PackageModel().add(inparam)
    // 操作日志记录
    inparam.operateAction = '创建道具包'
    inparam.operateToken = token
    new LogModel().addOperate(inparam, addInfoErr, addRet)
    // 返回结果
    if (addInfoErr) {
        return ResFail(cb, { ...res, err: addInfoErr }, addInfoErr.code)
    }
    return ResOK(cb, { ...res, payload: addRet })
}

/**
 * 道具包列表
 */
const packageList = async (e, c, cb) => {
    // 入参转换
    const res = { m: 'packageList' }
    const [jsonParseErr, inparam] = JSONParser(e && e.body)
    if (jsonParseErr) {
        return ResErr(cb, jsonParseErr)
    }
    // 业务操作
    let [err, ret] = await new PackageModel().list(inparam)
    // 结果返回
    if (err) {
        return ResFail(cb, { ...res, err: err }, err.code)
    }
    return ResOK(cb, { ...res, payload: ret })
}

/**
 * 单个道具包
 */
const packageOne = async (e, c, cb) => {
    const res = { m: 'packageOne' }
    const [jsonParseErr, inparam] = JSONParser(e && e.body)
    if (jsonParseErr) {
        return ResErr(cb, jsonParseErr)
    }
    let [err, ret] = await new PackageModel().getOne(inparam.packageName, inparam.packageId)
    if (err) {
        return ResFail(cb, { ...res, err: err }, err.code)
    }
    return ResOK(cb, { ...res, payload: ret })
}

/**
 * 道具包状态变更
 */
const packageChangeStatus = async (e, c, cb) => {
    // 数据输入，转换，校验
    const res = { m: 'packageChangeStatus' }
    const [jsonParseErr, inparam] = JSONParser(e && e.body)
    if (jsonParseErr) {
        return ResErr(cb, jsonParseErr)
    }
    //检查参数是否合法
    let [checkAttError, errorParams] = new PackageCheck().checkStatus(inparam)
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
    const [err, ret] = await new PackageModel().changeStatus(inparam)

    // 操作日志记录
    inparam.operateAction = '道具状态变更'
    inparam.operateToken = token
    new LogModel().addOperate(inparam, err, ret)

    if (err) {
        return ResFail(cb, { ...res, err: err }, err.code)
    } else {
        return ResOK(cb, { ...res, payload: ret })
    }
}

/**
 * 道具包更新
 */
const packageUpdate = async (e, c, cb) => {
    // 数据输入，转换，校验
    const res = { m: 'packageUpdate' }
    const [jsonParseErr, inparam] = JSONParser(e && e.body)
    if (jsonParseErr) {
        return ResErr(cb, jsonParseErr)
    }
    //检查参数是否合法
    let [checkAttError, errorParams] = new PackageCheck().checkUpdate(inparam)
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
    const [err, ret] = await new PackageModel().update(inparam)

    // 操作日志记录
    inparam.operateAction = '道具包更新'
    inparam.operateToken = token
    new LogModel().addOperate(inparam, err, ret)

    if (err) {
        return ResFail(cb, { ...res, err: err }, err.code)
    } else {
        return ResOK(cb, { ...res, payload: ret })
    }
}

/**
 * 道具包删除
 */
const packageDelete = async (e, c, cb) => {
    // 数据输入，转换，校验
    const res = { m: 'packageDelete' }
    const [jsonParseErr, inparam] = JSONParser(e && e.body)
    if (jsonParseErr) {
        return ResErr(cb, jsonParseErr)
    }
    //检查参数是否合法
    let [checkAttError, errorParams] = new PackageCheck().checkDelete(inparam)
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
    const [err, ret] = await new PackageModel().delete(inparam)

    // 操作日志记录
    inparam.operateAction = '道具包删除'
    inparam.operateToken = token
    new LogModel().addOperate(inparam, err, ret)

    if (err) {
        return ResFail(cb, { ...res, err: err }, err.code)
    } else {
        return ResOK(cb, { ...res, payload: ret })
    }
}

// ==================== 以下为内部方法 ====================

/**
  api export
**/
export {
    packageNew,                      // 创建道具包
    packageList,                     // 道具包列表
    packageOne,                      // 单个道具包
    packageUpdate,                   // 更新道具包
    packageChangeStatus,             // 道具包状态变更
    packageDelete                    // 道具包删除
}