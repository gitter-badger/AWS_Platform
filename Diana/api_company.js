import {
  Success,
  Fail,
  Codes,
  JSONParser,
  Model,
  Tables,
  RoleCodeEnum,
  RoleEditProps,
  Trim,
  Pick,
  JwtVerify,
  GeneratePolicyDocument,
  BizErr
} from './lib/all'
import { LogModel } from './model/LogModel'
import { CompanyModel } from './model/CompanyModel'

import { CompanyCheck } from './biz/CompanyCheck'


const ResOK = (callback, res) => callback(null, Success(res))
const ResFail = (callback, res, code = Codes.Error) => callback(null, Fail(res, code))
const ResErr = (callback, err) => ResFail(callback, { err: err }, err.code)

/**
 * 创建厂商
 */
const companyNew = async (e, c, cb) => {
  const errRes = { m: 'companyNew err'/*, input: e*/ }
  const res = { m: 'companyNew' }
  const [jsonParseErr, companyInfo] = JSONParser(e && e.body)
  if (jsonParseErr) {
    return ResErr(cb, jsonParseErr)
  }
  //检查参数是否合法
  let [checkAttError, errorParams] = new CompanyCheck().checkCompany(companyInfo)
  if (checkAttError) {
    Object.assign(checkAttError, { params: errorParams })
    return ResErr(cb, checkAttError)
  }
  // 获取令牌，只有管理员有权限
  const [tokenErr, token] = await Model.currentRoleToken(e, RoleCodeEnum['PlatformAdmin'])
  if (tokenErr) {
    return ResErr(cb, tokenErr)
  }

  const [addCompanyErr, addCompanyRet] = await new CompanyModel().addCompany(companyInfo)

  // 操作日志记录
  companyInfo.operateAction = '创建厂商'
  companyInfo.operateToken = token
  new LogModel().addOperate(companyInfo, addCompanyErr, addCompanyRet)

  if (addCompanyErr) {
    return ResFail(cb, { ...errRes, err: addCompanyErr }, addCompanyErr.code)
  }
  return ResOK(cb, { ...res, payload: addCompanyRet })
}

/**
 * 厂商列表
 */
const companyList = async (e, c, cb) => {
  const errRes = { m: 'companyList err'/*, input: e*/ }
  const res = { m: 'companyList' }
  const [jsonParseErr, inparam] = JSONParser(e && e.body)
  if (jsonParseErr) {
    return ResErr(cb, jsonParseErr)
  }

  // 获取令牌，只有管理员有权限
  const [tokenErr, token] = await Model.currentRoleToken(e, RoleCodeEnum['PlatformAdmin'])
  if (tokenErr) {
    return ResErr(cb, tokenErr)
  }

  const [err, ret] = await new CompanyModel().listCompany(inparam)
  if (err) {
    return ResFail(cb, { ...errRes, err: err }, err.code)
  }
  return ResOK(cb, { ...res, payload: ret })
}

/**
 * 单个厂商
 */
const companyOne = async (e, c, cb) => {
  // 入参转换
  const errRes = { m: 'companyOne err'/*, input: e*/ }
  const res = { m: 'companyOne' }
  const [paramsErr, companyParams] = Model.pathParams(e)
  if (paramsErr) {
    return ResErr(cb, jsonParseErr)
  }
  // 参数校验
  if (!companyParams.companyName || !companyParams.companyId) {
    return ResErr(cb, BizErr.InparamErr())
  } else {
    companyParams.companyName = decodeURIComponent(companyParams.companyName)
  }
  let [err, ret] = await new CompanyModel().getOne(companyParams.companyName, companyParams.companyId)
  if (err) {
    return ResFail(cb, { ...errRes, err: err }, err.code)
  }
  return ResOK(cb, { ...res, payload: ret })
}

/**
 * 厂商状态变更，接口编号：
 */
const companyChangeStatus = async (e, c, cb) => {
  // 数据输入，转换，校验
  const errRes = { m: 'companyChangeStatus error' }
  const res = { m: 'companyChangeStatus' }
  const [jsonParseErr, inparam] = JSONParser(e && e.body)
  if (jsonParseErr) {
    return ResErr(cb, jsonParseErr)
  }
  //检查参数是否合法
  let [checkAttError, errorParams] = new CompanyCheck().checkStatus(inparam)
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
  const [err, ret] = await new CompanyModel().changeStatus(inparam.companyName, inparam.companyId, inparam.status)

  // 操作日志记录
  inparam.operateAction = '厂商状态变更'
  inparam.operateToken = token
  new LogModel().addOperate(inparam, err, ret)

  if (err) {
    return ResFail(cb, { ...errRes, err: err }, err.code)
  } else {
    return ResOK(cb, { ...res, payload: ret })
  }
}

// ==================== 以下为内部方法 ====================

/**
  api export
**/
export {
  companyNew,                   // 新建厂商
  companyList,                  // 游戏厂商
  companyOne,                   // 单个厂商
  companyChangeStatus           // 厂商状态变更
}