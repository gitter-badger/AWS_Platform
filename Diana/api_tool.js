import {
  Success,
  Fail,
  Codes,
  JSONParser,
  Model,
  Tables,
  StatusEnum,
  ToolStatusEnum,
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
import { ToolModel } from './model/ToolModel'

import { ToolCheck } from './biz/ToolCheck'

const ResOK = (callback, res) => callback(null, Success(res))
const ResFail = (callback, res, code = Codes.Error) => callback(null, Fail(res, code))
const ResErr = (callback, err) => ResFail(callback, { err: err }, err.code)

/**
 * 创建道具
 */
const toolNew = async (e, c, cb) => {
  // 入参转换
  const errRes = { m: 'toolNew err'/*, input: e*/ }
  const res = { m: 'toolNew' }
  const [jsonParseErr, inparam] = JSONParser(e && e.body)
  if (jsonParseErr) {
    return ResErr(cb, jsonParseErr)
  }
  //检查参数是否合法
  let [checkAttError, errorParams] = new ToolCheck().check(inparam)
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
  const [addInfoErr, addRet] = await new ToolModel().addTool(inparam)
  // 操作日志记录
  inparam.operateAction = '创建道具'
  inparam.operateToken = token
  new LogModel().addOperate(inparam, addInfoErr, addRet)
  // 返回结果
  if (addInfoErr) {
    return ResFail(cb, { ...errRes, err: addInfoErr }, addInfoErr.code)
  }
  return ResOK(cb, { ...res, payload: addRet })
}

/**
 * 道具列表
 */
const toolList = async (e, c, cb) => {
  // 入参转换
  const errRes = { m: 'toolList err'/*, input: e*/ }
  const res = { m: 'toolList' }
  const [jsonParseErr, inparam] = JSONParser(e && e.body)
  if (jsonParseErr) {
    return ResErr(cb, jsonParseErr)
  }
  // 业务操作
  let [err, ret] = await new ToolModel().list(inparam)
  // 结果返回
  if (err) {
    return ResFail(cb, { ...errRes, err: err }, err.code)
  }
  return ResOK(cb, { ...res, payload: ret })
}

/**
 * 单个道具
 */
const toolOne = async (e, c, cb) => {
  const errRes = { m: 'toolOne err'/*, input: e*/ }
  const res = { m: 'toolOne' }
  const [jsonParseErr, inparam] = JSONParser(e && e.body)
  if (jsonParseErr) {
    return ResErr(cb, jsonParseErr)
  }
  let [err, ret] = await new ToolModel().getOne(inparam.toolName, inparam.toolId)
  if (err) {
    return ResFail(cb, { ...errRes, err: err }, err.code)
  }
  return ResOK(cb, { ...res, payload: ret })
}

/**
 * 道具状态变更
 */
const toolChangeStatus = async (e, c, cb) => {
  // 数据输入，转换，校验
  const errRes = { m: 'toolChangeStatus error' }
  const res = { m: 'toolChangeStatus' }
  const [jsonParseErr, inparam] = JSONParser(e && e.body)
  if (jsonParseErr) {
    return ResErr(cb, jsonParseErr)
  }
  //检查参数是否合法
  let [checkAttError, errorParams] = new ToolCheck().checkStatus(inparam)
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
  const [err, ret] = await new ToolModel().changeStatus(inparam.toolName, inparam.toolId, inparam.status)
  if (err) {
    return ResFail(cb, { ...errRes, err: err }, err.code)
  } else {
    return ResOK(cb, { ...res, payload: ret })
  }
}

/**
 * 道具更新
 */
const toolUpdate = async (e, c, cb) => {
  // 数据输入，转换，校验
  const errRes = { m: 'toolUpdate error' }
  const res = { m: 'toolUpdate' }
  const [jsonParseErr, inparam] = JSONParser(e && e.body)
  if (jsonParseErr) {
    return ResErr(cb, jsonParseErr)
  }
  //检查参数是否合法
  let [checkAttError, errorParams] = new ToolCheck().checkUpdate(inparam)
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
  const [err, ret] = await new ToolModel().updateTool(inparam)
  if (err) {
    return ResFail(cb, { ...errRes, err: err }, err.code)
  } else {
    return ResOK(cb, { ...res, payload: ret })
  }
}

// ==================== 以下为内部方法 ====================

// TOKEN验证
const jwtverify = async (e, c, cb) => {
  // get the token from event.authorizationToken
  const token = e.authorizationToken.split(' ')
  if (token[0] !== 'Bearer') {
    return c.fail('Unauthorized: wrong token type')
  }
  // verify it and return the policy statements
  const [err, userInfo] = await JwtVerify(token[1])
  if (err || !userInfo) {
    console.log(JSON.stringify(err), JSON.stringify(userInfo));
    return c.fail('Unauthorized')
  }
  console.info(userInfo)
  return c.succeed(GeneratePolicyDocument(userInfo.userId, 'Allow', e.methodArn, userInfo))
}

/**
  api export
**/
export {
  jwtverify,                    // 用于进行token验证的方法

  toolNew,                      // 创建道具
  toolList,                     // 道具列表
  toolOne,                      // 单个道具
  toolUpdate,                   // 更新道具
  toolChangeStatus              // 道具状态变更
}