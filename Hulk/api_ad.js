import { ResOK, ResFail, ResErr, Codes, JSONParser, Model, RoleCodeEnum, Trim, Pick, BizErr } from './lib/all'

import { LogModel } from './model/LogModel'
import { AdModel } from './model/AdModel'

import { AdCheck } from './biz/AdCheck'

/**
 * 创建
 */
const adNew = async (e, c, cb) => {
  // 入参转换
  const res = { m: 'adNew' }
  const [jsonParseErr, inparam] = JSONParser(e && e.body)
  if (jsonParseErr) {
    return ResErr(cb, jsonParseErr)
  }
  //检查参数是否合法
  let [checkAttError, errorParams] = new AdCheck().check(inparam)
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
  const [addInfoErr, addRet] = await new AdModel().addAd(inparam)
  // 操作日志记录
  inparam.operateAction = '创建公告'
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
const adList = async (e, c, cb) => {
  // 入参转换
  const res = { m: 'adList' }
  const [jsonParseErr, inparam] = JSONParser(e && e.body)
  if (jsonParseErr) {
    return ResErr(cb, jsonParseErr)
  }
  // 获取令牌，只有管理员有权限
  const [tokenErr, token] = await Model.currentRoleToken(e, RoleCodeEnum['PlatformAdmin'])
  if (tokenErr) {
    return ResErr(cb, tokenErr)
  }
  // 业务操作
  let [err, ret] = await new AdModel().list(inparam)
  // 结果返回
  if (err) {
    return ResFail(cb, { ...res, err: err }, err.code)
  }
  return ResOK(cb, { ...res, payload: ret })
}

/**
 * 单个
 */
const adOne = async (e, c, cb) => {
  // 入参数据
  const res = { m: 'adOne' }
  const [jsonParseErr, inparam] = JSONParser(e && e.body)
  if (jsonParseErr) {
    return ResErr(cb, jsonParseErr)
  }
  // 获取令牌，只有管理员有权限
  const [tokenErr, token] = await Model.currentRoleToken(e, RoleCodeEnum['PlatformAdmin'])
  if (tokenErr) {
    return ResErr(cb, tokenErr)
  }
  let [err, ret] = await new AdModel().getOne(inparam)
  if (err) {
    return ResFail(cb, { ...res, err: err }, err.code)
  }
  return ResOK(cb, { ...res, payload: ret })
}

/**
 * 状态变更
 */
const adChangeStatus = async (e, c, cb) => {
  // 数据输入，转换，校验
  const res = { m: 'adChangeStatus' }
  const [jsonParseErr, inparam] = JSONParser(e && e.body)
  if (jsonParseErr) {
    return ResErr(cb, jsonParseErr)
  }
  //检查参数是否合法
  let [checkAttError, errorParams] = new AdCheck().checkStatus(inparam)
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
  const [err, ret] = await new AdModel().changeStatus(inparam)
  // 操作日志记录
  inparam.operateAction = '公告状态变更'
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
const adUpdate = async (e, c, cb) => {
  // 数据输入，转换，校验
  const res = { m: 'adUpdate' }
  const [jsonParseErr, inparam] = JSONParser(e && e.body)
  if (jsonParseErr) {
    return ResErr(cb, jsonParseErr)
  }
  //检查参数是否合法
  let [checkAttError, errorParams] = new AdCheck().checkUpdate(inparam)
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
  const [err, ret] = await new AdModel().updateAd(inparam)

  // 操作日志记录
  inparam.operateAction = '公告更新'
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
const adDelete = async (e, c, cb) => {
  // 数据输入，转换，校验
  const res = { m: 'adDelete' }
  const [jsonParseErr, inparam] = JSONParser(e && e.body)
  if (jsonParseErr) {
    return ResErr(cb, jsonParseErr)
  }
  //检查参数是否合法
  let [checkAttError, errorParams] = new AdCheck().checkDelete(inparam)
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
  const [err, ret] = await new AdModel().delete(inparam)

  // 操作日志记录
  inparam.operateAction = '公告删除'
  inparam.operateToken = token
  new LogModel().addOperate(inparam, err, ret)

  if (err) {
    return ResFail(cb, { ...res, err: err }, err.code)
  } else {
    return ResOK(cb, { ...res, payload: ret })
  }
}

// ==================== 以下为内部方法 ====================

export {
  adNew,                      // 创建
  adList,                     // 列表
  adOne,                      // 单个
  adUpdate,                   // 更新
  adChangeStatus,             // 状态变更
  adDelete                    // 删除
}