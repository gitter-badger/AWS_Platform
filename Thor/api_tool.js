import { ResOK, ResFail, ResErr, Codes, JSONParser, Model, RoleCodeEnum, Trim, Pick, BizErr } from './lib/all'

import { LogModel } from './model/LogModel'
import { ToolModel } from './model/ToolModel'

import { ToolCheck } from './biz/ToolCheck'

/**
 * 创建道具
 */
const toolNew = async (e, c, cb) => {
  try {
    // 入参转换
    const res = { m: 'toolNew' }
    const [jsonParseErr, inparam] = JSONParser(e && e.body)
    // 检查参数是否合法
    let [checkAttError, errorParams] = new ToolCheck().check(inparam)
    // 获取令牌，只有管理员有权限
    const [tokenErr, token] = await Model.currentRoleToken(e, RoleCodeEnum['PlatformAdmin'])

    // 业务操作
    const [addInfoErr, addRet] = await new ToolModel().addTool(inparam)

    // 操作日志记录
    inparam.operateAction = '创建道具'
    inparam.operateToken = token
    new LogModel().addOperate(inparam, addInfoErr, addRet)
    // 返回结果
    if (addInfoErr) { return ResFail(cb, { ...res, err: addInfoErr }, addInfoErr.code) }
    return ResOK(cb, { ...res, payload: addRet })
  } catch (error) {
    return ResErr(cb, error)
  }
}

/**
 * 道具列表
 */
const toolList = async (e, c, cb) => {
  try {
    // 入参转换
    const res = { m: 'toolList' }
    const [jsonParseErr, inparam] = JSONParser(e && e.body)
    // 获取令牌，只有管理员有权限
    const [tokenErr, token] = await Model.currentRoleToken(e, RoleCodeEnum['PlatformAdmin'])

    // 业务操作
    let [err, ret] = await new ToolModel().list(inparam)

    // 结果返回
    if (err) { return ResFail(cb, { ...res, err: err }, err.code) }
    return ResOK(cb, { ...res, payload: ret })
  } catch (error) {
    return ResErr(cb, error)
  }

}

/**
 * 单个道具
 */
const toolOne = async (e, c, cb) => {
  try {
    // 入参转换
    const res = { m: 'toolOne' }
    const [jsonParseErr, inparam] = JSONParser(e && e.body)
    // 获取令牌，只有管理员有权限
    const [tokenErr, token] = await Model.currentRoleToken(e, RoleCodeEnum['PlatformAdmin'])

    // 业务操作
    let [err, ret] = await new ToolModel().getOne(inparam)

    // 结果返回
    if (err) { return ResFail(cb, { ...res, err: err }, err.code) }
    return ResOK(cb, { ...res, payload: ret })
  } catch (error) {
    return ResErr(cb, error)
  }

}

/**
 * 道具状态变更
 */
const toolChangeStatus = async (e, c, cb) => {
  try {
    // 入参转换
    const res = { m: 'toolChangeStatus' }
    const [jsonParseErr, inparam] = JSONParser(e && e.body)
    // 检查参数是否合法
    let [checkAttError, errorParams] = new ToolCheck().checkStatus(inparam)
    // 获取令牌，只有管理员有权限
    const [tokenErr, token] = await Model.currentRoleToken(e, RoleCodeEnum['PlatformAdmin'])

    // 业务操作
    const [err, ret] = await new ToolModel().changeStatus(inparam)

    // 操作日志记录
    inparam.operateAction = '道具状态变更'
    inparam.operateToken = token
    new LogModel().addOperate(inparam, err, ret)
    // 结果返回
    if (err) { return ResFail(cb, { ...res, err: err }, err.code) }
    return ResOK(cb, { ...res, payload: ret })
  } catch (error) {
    return ResErr(cb, error)
  }
}

/**
 * 道具更新
 */
const toolUpdate = async (e, c, cb) => {
  try {
    // 入参转换
    const res = { m: 'toolUpdate' }
    const [jsonParseErr, inparam] = JSONParser(e && e.body)
    // 检查参数是否合法
    let [checkAttError, errorParams] = new ToolCheck().checkUpdate(inparam)
    // 获取令牌，只有管理员有权限
    const [tokenErr, token] = await Model.currentRoleToken(e, RoleCodeEnum['PlatformAdmin'])

    // 业务操作
    const [err, ret] = await new ToolModel().updateTool(inparam)

    // 操作日志记录
    inparam.operateAction = '道具更新'
    inparam.operateToken = token
    new LogModel().addOperate(inparam, err, ret)
    // 结果返回
    if (err) { return ResFail(cb, { ...res, err: err }, err.code) }
    return ResOK(cb, { ...res, payload: ret })
  } catch (error) {
    return ResErr(cb, error)
  }
}

/**
 * 删除
 */
const toolDelete = async (e, c, cb) => {
  try {
    // 入参转换
    const res = { m: 'toolDelete' }
    const [jsonParseErr, inparam] = JSONParser(e && e.body)
    //检查参数是否合法
    let [checkAttError, errorParams] = new ToolCheck().checkDelete(inparam)
    // 获取令牌，只有管理员有权限
    const [tokenErr, token] = await Model.currentRoleToken(e, RoleCodeEnum['PlatformAdmin'])

    // 业务操作
    const [err, ret] = await new ToolModel().delete(inparam)

    // 操作日志记录
    inparam.operateAction = '道具删除'
    inparam.operateToken = token
    new LogModel().addOperate(inparam, err, ret)
    // 结果返回
    if (err) { return ResFail(cb, { ...res, err: err }, err.code) }
    return ResOK(cb, { ...res, payload: ret })
  } catch (error) {
    return ResErr(cb, error)
  }
}

// ==================== 以下为内部方法 ====================

export {
  toolNew,                      // 创建道具
  toolList,                     // 道具列表
  toolOne,                      // 单个道具
  toolUpdate,                   // 更新道具
  toolChangeStatus,             // 道具状态变更
  toolDelete                    // 道具删除
}