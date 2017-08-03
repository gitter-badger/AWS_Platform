import {
  Success,
  Fail,
  Codes,
  JSONParser,
  Model,
  Trim,
  Pick,
  JwtVerify,
  GeneratePolicyDocument,
  BizErr,
  StatusEnum,
  MSNStatusEnum,
  RoleCodeEnum,
  RoleEditProps
} from './lib/all'
import { RegisterAdmin, RegisterUser, LoginUser, UserGrabToken } from './biz/auth'
import { UserModel } from './model/UserModel'
import { LogModel } from './model/LogModel'
import { BillModel } from './model/BillModel'

import { UserCheck } from './biz/UserCheck'


const ResOK = (callback, res) => callback(null, Success(res))
const ResFail = (callback, res, code = Codes.Error) => callback(null, Fail(res, code))
const ResErr = (callback, err) => ResFail(callback, { err: err }, err.code)

/**
 * 建站商列表
 */
const managerList = async (e, c, cb) => {
  // 入参校验
  const errRes = { m: 'managerList error'/*, input: e*/ }
  const res = { m: 'managerList' }
  const [tokenErr, token] = await Model.currentToken(e)
  if (tokenErr) {
    return ResErr(cb, tokenErr)
  }
  // 业务操作
  const [err, ret] = await new UserModel().listChildUsers(token, RoleCodeEnum.Manager)
  // 结果返回
  if (err) {
    return ResFail(cb, { ...errRes, err: err }, err.code)
  }
  // 查询每个用户余额
  for (let user of ret) {
    let [balanceErr, lastBill] = await new BillModel().checkUserBalance(user)
    user.balance = lastBill.lastBalance
    user.lastBill = lastBill
    // 查询已用商户已用数量
    const [err, ret] = await new UserModel().listChildUsers(user, RoleCodeEnum['Merchant'])
    if (ret && ret.length > 0) {
      user.merchantUsedCount = ret.length
    } else {
      user.merchantUsedCount = 0
    }
  }
  return ResOK(cb, { ...res, payload: ret })
}
/**
 * 获取建站商信息
 */
const managerOne = async (e, c, cb) => {
  // 入参校验
  const errRes = { m: 'managerOne err'/*, input: e*/ }
  const res = { m: 'managerOne' }
  const [paramsErr, params] = Model.pathParams(e)
  if (paramsErr || !params.id) {
    return ResFail(cb, { ...errRes, err: paramsErr }, paramsErr.code)
  }
  const [tokenErr, token] = await Model.currentToken(e)
  if (tokenErr) {
    return ResFail(cb, { ...errRes, err: tokenErr }, tokenErr.code)
  }
  // 业务操作
  const [managerErr, manager] = await new UserModel().getUser(params.id, RoleCodeEnum['Manager'])
  // 结果返回
  if (managerErr) {
    return ResFail(cb, { ...errRes, err: managerErr }, managerErr.code)
  }
  return ResOK(cb, { ...res, payload: manager })
}
/**
 * 更新线路商信息
 */
const managerUpdate = async (e, c, cb) => {
  // 入参校验
  const errRes = { m: 'managerUpdate err'/*, input: e*/ }
  const res = { m: 'managerUpdate' }
  const [paramsErr, params] = Model.pathParams(e)
  if (paramsErr || !params.id) {
    return ResFail(cb, { ...errRes, err: paramsErr }, paramsErr.code)
  }
  // 入参转化
  const [jsonParseErr, managerInfo] = JSONParser(e && e.body)
  if (jsonParseErr) {
    return ResFail(cb, { ...errRes, err: jsonParseErr }, jsonParseErr.code)
  }
  //检查参数是否合法
  let [checkAttError, errorParams] = new UserCheck().checkUser(managerInfo)
  if (checkAttError) {
    Object.assign(checkAttError, { params: errorParams })
    return ResErr(cb, checkAttError)
  }
  // 获取令牌
  const [tokenErr, token] = await Model.currentToken(e)
  if (tokenErr) {
    return ResFail(cb, { ...errRes, err: tokenErr }, tokenErr.code)
  }
  // 业务操作
  const [managerErr, manager] = await new UserModel().getUser(params.id, RoleCodeEnum['Manager'])
  if (managerErr) {
    return ResFail(cb, { ...errRes, err: managerErr }, managerErr.code)
  }
  // 获取更新属性和新密码HASH
  const Manager = {
    ...manager,
    ...Pick(managerInfo, RoleEditProps[RoleCodeEnum['Manager']])
  }
  Manager.passhash = Model.hashGen(Manager.password)
  // 业务操作
  const [updateErr, updateRet] = await new UserModel().userUpdate(Manager)
  // 操作日志记录
  params.operateAction = '更新线路商信息'
  params.operateToken = token
  new LogModel().addOperate(params, updateErr, updateRet)
  // 结果返回
  if (updateErr) {
    return ResFail(cb, { ...errRes, err: updateErr }, updateErr.code)
  }
  return ResOK(cb, { ...res, payload: updateRet })
}

/**
 * 可用线路商
 */
const avalibleManagers = async (e, c, cb) => {
  const errRes = { m: 'avalibleManagers err'/*, input: e*/ }
  const res = { m: 'avalibleManagers' }
  const [err, ret] = await new UserModel().listAvalibleManagers()
  if (err) {
    return ResFail(cb, { ...errRes, err: err }, err.code)
  }
  return ResOK(cb, { ...res, payload: ret })
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
    console.error(JSON.stringify(err), JSON.stringify(userInfo))
    return c.fail('Unauthorized')
  }
  // 有效期校验
  console.info('解密')
  console.info(Math.floor(new Date().getTime() / 1000))
  console.info(userInfo.iat)
  console.info(Math.floor((new Date().getTime() / 1000)) - userInfo.iat)
  // if(new Date().getTime - userInfo.iat > 100000){
  //   return c.fail('Token expire')
  // }
  // TOKEN是否有效校验（判断密码是否一致）
  // if(!userInfo.password){
  //   return c.fail('Token locked')
  // }
  // 结果返回
  return c.succeed(GeneratePolicyDocument(userInfo.userId, 'Allow', e.methodArn, userInfo))

}

/**
  api export
**/
export {
  jwtverify,                    // 用于进行token验证的方法

  managerList,                  // 建站商列表
  managerOne,                   // 建站商详情
  managerUpdate,                // 编辑某个建站商
  avalibleManagers             // 当前可用的建站商
}
