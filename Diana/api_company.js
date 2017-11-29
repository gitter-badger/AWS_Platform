import { ResOK, ResErr, Codes, JSONParser, Model, RoleCodeEnum, BizErr } from './lib/all'
import { LogModel } from './model/LogModel'
import { CompanyModel } from './model/CompanyModel'

import { CompanyCheck } from './biz/CompanyCheck'

/**
 * 创建厂商
 */
const companyNew = async (e, c, cb) => {
  try {
    const [jsonParseErr, companyInfo] = JSONParser(e && e.body)
    //检查参数是否合法
    const [checkAttError, errorParams] = new CompanyCheck().checkCompany(companyInfo)
    // 获取令牌，只有管理员有权限
    const [tokenErr, token] = await Model.currentRoleToken(e, RoleCodeEnum['PlatformAdmin'])

    // 业务操作
    const [addCompanyErr, addCompanyRet] = await new CompanyModel().addCompany(companyInfo)

    // 操作日志记录
    companyInfo.operateAction = '创建厂商'
    companyInfo.operateToken = token
    new LogModel().addOperate(companyInfo, addCompanyErr, addCompanyRet)
    // 结果返回
    if (addCompanyErr) { return ResErr(cb, addCompanyErr) }
    return ResOK(cb, { payload: addCompanyRet })
  } catch (error) {
    return ResErr(cb, error)
  }
}

/**
 * 厂商列表
 */
const companyList = async (e, c, cb) => {
  try {
    const [jsonParseErr, inparam] = JSONParser(e && e.body)
    // 获取令牌，只有管理员有权限
    const [tokenErr, token] = await Model.currentRoleToken(e, RoleCodeEnum['PlatformAdmin'])

    // 业务操作  
    const [err, ret] = await new CompanyModel().listCompany(inparam)

    // 结果返回
    if (err) { return ResErr(cb, err) }
    return ResOK(cb, { payload: ret })
  } catch (error) {
    return ResErr(cb, error)
  }
}

/**
 * 单个厂商
 */
const companyOne = async (e, c, cb) => {
  try {
    // 入参转换
    const [paramsErr, inparam] = Model.pathParams(e)
    if (paramsErr) {
      return ResErr(cb, jsonParseErr)
    }
    // 参数校验
    if (!inparam.companyName || !inparam.companyId) {
      return ResErr(cb, BizErr.InparamErr())
    } else {
      inparam.companyName = decodeURIComponent(inparam.companyName)
    }
    // 获取令牌，只有管理员有权限
    const [tokenErr, token] = await Model.currentRoleToken(e, RoleCodeEnum['PlatformAdmin'])

    // 业务操作
    const [err, ret] = await new CompanyModel().getOne(inparam)

    // 结果返回
    if (err) { return ResErr(cb, err) }
    return ResOK(cb, { payload: ret })
  } catch (error) {
    return ResErr(cb, error)
  }
}

/**
 * 厂商状态变更，接口编号：
 */
const companyChangeStatus = async (e, c, cb) => {
  try {
    // 数据输入，转换，校验
    const [jsonParseErr, inparam] = JSONParser(e && e.body)
    //检查参数是否合法
    const [checkAttError, errorParams] = new CompanyCheck().checkStatus(inparam)
    // 获取令牌，只有管理员有权限
    const [tokenErr, token] = await Model.currentRoleToken(e, RoleCodeEnum['PlatformAdmin'])

    // 业务操作
    const [err, ret] = await new CompanyModel().changeStatus(inparam.companyName, inparam.companyId, inparam.status)

    // 操作日志记录
    inparam.operateAction = '厂商状态变更'
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
 * 变更厂商
 */
const companyUpdate = async (e, c, cb) => {
  try {
    // 入参转换
    const [jsonParseErr, inparam] = JSONParser(e && e.body)
    // 检查参数是否合法
    const [checkAttError, errorParams] = new CompanyCheck().checkUpdate(inparam)
    // 获取令牌，只有管理员有权限
    const [tokenErr, token] = await Model.currentRoleToken(e, RoleCodeEnum['PlatformAdmin'])

    // 业务操作
    const [err, ret] = await new CompanyModel().update(inparam)

    // 操作日志记录
    inparam.operateAction = '厂商更新'
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
  companyNew,                   // 新建厂商
  companyList,                  // 游戏厂商
  companyOne,                   // 单个厂商
  companyChangeStatus,          // 厂商状态变更
  companyUpdate                 // 厂商变更
}