import { ResOK, ResErr, Codes, JSONParser, Model, RoleCodeEnum, BizErr } from './lib/all'

import { LogModel } from './model/LogModel'
import { PackageModel } from './model/PackageModel'

import { PackageCheck } from './biz/PackageCheck'

/**
 * 创建道具包
 */
const packageNew = async (e, c, cb) => {
    try {
        // 入参转换
        const [jsonParseErr, inparam] = JSONParser(e && e.body)
        // 检查参数是否合法
        const [checkAttError, errorParams] = new PackageCheck().check(inparam)
        // 获取令牌，只有管理员有权限
        const [tokenErr, token] = await Model.currentRoleToken(e, RoleCodeEnum['PlatformAdmin'])

        // 业务操作
        const [addInfoErr, addRet] = await new PackageModel().add(inparam)

        // 操作日志记录
        inparam.operateAction = '创建道具包'
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
 * 道具包列表
 */
const packageList = async (e, c, cb) => {
    try {
        // 入参转换
        const [jsonParseErr, inparam] = JSONParser(e && e.body)
        // 获取令牌，只有管理员有权限
        const [tokenErr, token] = await Model.currentRoleToken(e, RoleCodeEnum['PlatformAdmin'])

        // 业务操作
        const [err, ret] = await new PackageModel().list(inparam)

        // 结果返回
        if (err) { return ResErr(cb, err) }
        return ResOK(cb, { payload: ret })
    } catch (error) {
        return ResErr(cb, error)
    }
}

/**
 * 单个道具包
 */
const packageOne = async (e, c, cb) => {
    try {
        // 入参转换
        const [jsonParseErr, inparam] = JSONParser(e && e.body)
        // 获取令牌，只有管理员有权限
        const [tokenErr, token] = await Model.currentRoleToken(e, RoleCodeEnum['PlatformAdmin'])

        // 业务操作
        const [err, ret] = await new PackageModel().getOne(inparam.packageName, inparam.packageId)

        // 结果返回
        if (err) { return ResErr(cb, err) }
        return ResOK(cb, { payload: ret })
    } catch (error) {
        return ResErr(cb, error)
    }
}

/**
 * 道具包状态变更
 */
const packageChangeStatus = async (e, c, cb) => {
    try {
        // 数据输入，转换，校验
        const [jsonParseErr, inparam] = JSONParser(e && e.body)
        // 检查参数是否合法
        const [checkAttError, errorParams] = new PackageCheck().checkStatus(inparam)
        // 获取令牌，只有管理员有权限
        const [tokenErr, token] = await Model.currentRoleToken(e, RoleCodeEnum['PlatformAdmin'])

        // 业务操作
        const [err, ret] = await new PackageModel().changeStatus(inparam)

        // 操作日志记录
        inparam.operateAction = '道具状态变更'
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
 * 道具包更新
 */
const packageUpdate = async (e, c, cb) => {
    try {
        // 数据输入，转换，校验
        const [jsonParseErr, inparam] = JSONParser(e && e.body)
        //检查参数是否合法
        const [checkAttError, errorParams] = new PackageCheck().checkUpdate(inparam)
        // 获取令牌，只有管理员有权限
        const [tokenErr, token] = await Model.currentRoleToken(e, RoleCodeEnum['PlatformAdmin'])

        // 业务操作
        const [err, ret] = await new PackageModel().update(inparam)

        // 操作日志记录
        inparam.operateAction = '道具包更新'
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
 * 道具包删除
 */
const packageDelete = async (e, c, cb) => {
    try {
        // 数据输入，转换，校验
        const [jsonParseErr, inparam] = JSONParser(e && e.body)
        // 检查参数是否合法
        const [checkAttError, errorParams] = new PackageCheck().checkDelete(inparam)
        // 获取令牌，只有管理员有权限
        const [tokenErr, token] = await Model.currentRoleToken(e, RoleCodeEnum['PlatformAdmin'])

        // 业务操作
        const [err, ret] = await new PackageModel().delete(inparam)

        // 操作日志记录
        inparam.operateAction = '道具包删除'
        inparam.operateToken = token
        new LogModel().addOperate(inparam, err, ret)
        // 结果返回
        if (err) { return ResErr(cb, err) }
        return ResOK(cb, { payload: ret })
    } catch (error) {
        return ResErr(cb, error)
    }
}

// ==================== 以下为内部方法 ====================

export {
    packageNew,                      // 创建道具包
    packageList,                     // 道具包列表
    packageOne,                      // 单个道具包
    packageUpdate,                   // 更新道具包
    packageChangeStatus,             // 道具包状态变更
    packageDelete                    // 道具包删除
}