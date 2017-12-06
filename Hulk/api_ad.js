import { ResOK, ResErr, Codes, JSONParser, Model, RoleCodeEnum, BizErr } from './lib/all'

import { LogModel } from './model/LogModel'
import { AdModel } from './model/AdModel'

import { AdCheck } from './biz/AdCheck'

/**
 * 创建
 */
const adNew = async (e, c, cb) => {
  try {
    // 入参转换
    const [jsonParseErr, inparam] = JSONParser(e && e.body)
    // 检查参数是否合法
    const [checkAttError, errorParams] = new AdCheck().check(inparam)
    // 身份令牌
    const [tokenErr, token] = await Model.currentToken(e)
    // 业务操作
    inparam.operatorName = token.username
    inparam.operatorRole = token.role
    inparam.operatorMsn = token.msn || Model.StringValue
    inparam.operatorId = token.userId
    inparam.operatorDisplayName = token.displayName
    const [addInfoErr, addRet] = await new AdModel().addAd(inparam)
    // 操作日志记录
    inparam.operateAction = '创建公告'
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
const adList = async (e, c, cb) => {
  try {
    // 入参转换
    const [jsonParseErr, inparam] = JSONParser(e && e.body)
    // 身份令牌
    const [tokenErr, token] = await Model.currentToken(e)
    // 业务操作
    inparam.token = token
    const [err, ret] = await new AdModel().list(inparam)
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
const adOne = async (e, c, cb) => {
  try {
    // 入参数据
    const [jsonParseErr, inparam] = JSONParser(e && e.body)
    // 身份令牌
    const [tokenErr, token] = await Model.currentToken(e)
    // 业务操作
    const [err, ret] = await new AdModel().getOne(inparam)
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
const adChangeStatus = async (e, c, cb) => {
  try {
    // 入参转换
    const [jsonParseErr, inparam] = JSONParser(e && e.body)
    //检查参数是否合法
    const [checkAttError, errorParams] = new AdCheck().checkStatus(inparam)
    // 身份令牌
    const [tokenErr, token] = await Model.currentToken(e)
    // 业务操作
    const [err, ret] = await new AdModel().changeStatus(inparam)
    // 操作日志记录
    inparam.operateAction = '公告状态变更'
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
const adUpdate = async (e, c, cb) => {
  try {
    // 入参转换
    const [jsonParseErr, inparam] = JSONParser(e && e.body)
    // 检查参数是否合法
    const [checkAttError, errorParams] = new AdCheck().checkUpdate(inparam)
    // 身份令牌
    const [tokenErr, token] = await Model.currentToken(e)
    // 业务操作
    const [err, ret] = await new AdModel().updateAd(inparam)
    // 操作日志记录
    inparam.operateAction = '公告更新'
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
const adDelete = async (e, c, cb) => {
  try {
    // 数据输入，转换，校验
    const [jsonParseErr, inparam] = JSONParser(e && e.body)
    // 检查参数是否合法
    const [checkAttError, errorParams] = new AdCheck().checkDelete(inparam)
    // 身份令牌
    const [tokenErr, token] = await Model.currentToken(e)
    // 业务操作
    const [err, ret] = await new AdModel().delete(inparam)
    // 操作日志记录
    inparam.operateAction = '公告删除'
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
  adNew,                      // 创建
  adList,                     // 列表
  adOne,                      // 单个
  adUpdate,                   // 更新
  adChangeStatus,             // 状态变更
  adDelete                    // 删除
}