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
 * 接口编号：0
 * 生成第一个管理员
 */
const eva = async (e, c, cb) => {
  // 数据输入，转换，校验
  const errRes = { m: 'eva error' }
  const res = { m: 'eva' }
  const [jsonParseErr, userInfo] = JSONParser(e && e.body)
  if (jsonParseErr) {
    return ResFail(cb, { ...errRes, err: jsonParseErr }, jsonParseErr.code)
  }
  //检查参数是否合法
  let [checkAttError, errorParams] = new UserCheck().checkAdmin(userInfo)
  if (checkAttError) {
    Object.assign(checkAttError, { params: errorParams })
    return ResErr(cb, checkAttError)
  }
  // 生成第一个管理员业务
  const token = userInfo  // TODO 该接口不需要TOKEN，默认设置
  const [registerUserErr, resgisterUserRet] = await RegisterAdmin(token, Model.addSourceIP(e, userInfo))
  // 结果返回
  if (registerUserErr) {
    return ResFail(cb, { ...errRes, err: registerUserErr }, registerUserErr.code)
  }
  return ResOK(cb, { ...res, payload: resgisterUserRet })
}

/**
 * 创建管理员帐号
 */
const adminNew = async (e, c, cb) => {
  // 数据输入，转换，校验
  const [jsonParseErr, userInfo] = JSONParser(e && e.body)
  if (jsonParseErr) {
    return ResErr(cb, jsonParseErr)
  }
  //检查参数是否合法
  let [checkAttError, errorParams] = new UserCheck().checkAdmin(userInfo)
  if (checkAttError) {
    Object.assign(checkAttError, { params: errorParams })
    return ResErr(cb, checkAttError)
  }
  // 要求管理员角色
  const [tokenErr, token] = await Model.currentRoleToken(e, RoleCodeEnum['PlatformAdmin'])
  if (tokenErr) {
    return ResErr(cb, tokenErr)
  }
  // 业务操作
  const [registAdminErr, adminUser] = await RegisterAdmin(token, Model.addSourceIP(e, userInfo))
  // 操作日志记录
  userInfo.operateAction = '创建管理员帐号'
  userInfo.operateToken = token
  new LogModel().addOperate(Model.addSourceIP(e, userInfo), registAdminErr, adminUser)
  // 结果返回
  if (registAdminErr) {
    return ResErr(cb, registAdminErr)
  }
  return ResOK(cb, { payload: adminUser })
}
/**
 * 用户注册
 */
const userNew = async (e, c, cb) => {
  const errRes = { m: 'userNew error', /*input: e*/ }
  const res = { m: 'userNew' }
  // 从POST 的body中获取提交数据
  const [jsonParseErr, userInfo] = JSONParser(e && e.body)
  if (jsonParseErr) {
    return ResErr(cb, jsonParseErr)
  }
  //检查参数是否合法
  let [checkAttError, errorParams] = new UserCheck().checkUser(userInfo)
  if (checkAttError) {
    Object.assign(checkAttError, { params: errorParams })
    return ResErr(cb, checkAttError)
  }
  // 获取身份令牌
  const [tokenErr, token] = await Model.currentToken(e)
  if (tokenErr) {
    return ResErr(cb, tokenErr)
  }
  //创建用户账号的只能是管理员或线路商
  if (token.role != RoleCodeEnum['PlatformAdmin'] && token.role != RoleCodeEnum['Manager']) {
    return [BizErr.TokenErr('must admin/manager token'), 0]
  }
  // 业务操作
  const [registerUserErr, resgisterUserRet] = await RegisterUser(token, Model.addSourceIP(e, userInfo))
  // 操作日志记录
  userInfo.operateAction = '创建用户'
  userInfo.operateToken = token
  new LogModel().addOperate(Model.addSourceIP(e, userInfo), registerUserErr, resgisterUserRet)
  // 结果返回
  if (registerUserErr) {
    return ResFail(cb, { ...errRes, err: registerUserErr }, registerUserErr.code)
  }

  return ResOK(cb, { ...res, payload: resgisterUserRet });

}

/**
 * 用户登录
 */
const userAuth = async (e, c, cb) => {
  const errRes = { m: 'userAuth error'/*, input: e*/ }
  const res = { m: 'userAuth' }
  // 输入参数转换与校验
  const [jsonParseErr, userLoginInfo] = JSONParser(e && e.body)
  if (jsonParseErr) {
    return ResErr(cb, jsonParseErr)
  }
  // 用户登录
  const [loginUserErr, loginUserRet] = await LoginUser(Model.addSourceIP(e, userLoginInfo))
  // 登录日志
  new LogModel().addLogin(Model.addSourceIP(e, userLoginInfo), loginUserErr, Model.addSourceIP(e, loginUserRet))
  // 结果返回
  if (loginUserErr) {
    return ResFail(cb, { ...errRes, err: loginUserErr }, loginUserErr.code)
  }
  return ResOK(cb, { ...res, payload: loginUserRet })
}

/**
 * 获取用户TOKEN
 */
const userGrabToken = async (e, c, cb) => {
  const errRes = { m: 'userGrabToken error'/*, input: e*/ }
  const res = { m: 'userGrabToken' }
  // username suffix role and apiKey
  const [jsonParseErr, userInfo] = JSONParser(e && e.body)
  if (jsonParseErr) {
    return ResFail(cb, { ...errRes, err: jsonParseErr }, jsonParseErr.code)
  }
  // 业务操作
  const [tokenErr, userToken] = await UserGrabToken(Model.addSourceIP(e, userInfo))
  // 结果返回
  if (tokenErr) {
    return ResFail(cb, { ...errRes, err: tokenErr }, tokenErr.code)
  }
  return ResOK(cb, { ...res, payload: userToken })

}

/**
 * 变更用户状态
 */
const userChangeStatus = async (e, c, cb) => {
  const errRes = { m: 'userChangeStatus error'/*, input: e*/ }
  const res = { m: 'userChangeStatus' }
  // 入参转换和校验
  const [jsonParseErr, inparam] = JSONParser(e && e.body)
  if (jsonParseErr) {
    return ResErr(cb, jsonParseErr)
  }
  //检查参数是否合法
  let [checkAttError, errorParams] = new UserCheck().checkStatus(inparam)
  if (checkAttError) {
    Object.assign(checkAttError, { params: errorParams })
    return ResErr(cb, checkAttError)
  }
  // 身份令牌，只有管理员有权限
  const [tokenErr, token] = await Model.currentRoleToken(e, RoleCodeEnum['PlatformAdmin'])
  if (tokenErr) {
    return ResErr(cb, tokenErr)
  }
  // 更新用户状态
  const [err, ret] = await new UserModel().changeStatus(inparam.role, inparam.userId, inparam.status)
  // 操作日志记录
  inparam.operateAction = '变更用户状态'
  inparam.operateToken = token
  new LogModel().addOperate(inparam, err, ret)
  // 结果返回
  if (err) {
    return ResFail(cb, { ...errRes, err: err }, err.code)
  } else {
    return ResOK(cb, { ...res, payload: ret })
  }
}

/**
 * 检查用户是否被占用
 */
const checkUserExist = async (e, c, cb) => {
  const errRes = { m: 'checkUserExist error'/*, input: e*/ }
  const res = { m: 'checkUserExist' }
  // 入参转换和校验
  const [jsonParseErr, inparam] = JSONParser(e && e.body)
  if (jsonParseErr) {
    return ResErr(cb, jsonParseErr)
  }
  if (!inparam.role || !inparam.suffix || !inparam.username) {
    return ResFail(cb, { ...errRes, err: BizErr.InparamErr() }, BizErr.InparamErr().code)
  }
  // 身份令牌，只有管理员有权限
  const [tokenErr, token] = await Model.currentRoleToken(e, RoleCodeEnum['PlatformAdmin'])
  if (tokenErr) {
    return ResErr(cb, tokenErr)
  }
  // 业务操作
  let [err, ret] = await new UserModel().checkUserBySuffix(inparam.role, inparam.suffix, inparam.username)
  // 结果返回
  if (err) {
    return ResFail(cb, { ...errRes, err: err }, err.code)
  } else {
    return ResOK(cb, { ...res, payload: ret })
  }
}

/**
 * 检查前缀是否被占用
 */
const checkSuffixExist = async (e, c, cb) => {
  const errRes = { m: 'checkSuffixExist error'/*, input: e*/ }
  const res = { m: 'checkSuffixExist' }
  // 入参转换和校验
  const [jsonParseErr, inparam] = JSONParser(e && e.body)
  if (jsonParseErr) {
    return ResErr(cb, jsonParseErr)
  }
  if (!inparam.role || !inparam.suffix) {
    return ResFail(cb, { ...errRes, err: BizErr.InparamErr() }, BizErr.InparamErr().code)
  }
  // 身份令牌，只有管理员有权限
  const [tokenErr, token] = await Model.currentRoleToken(e, RoleCodeEnum['PlatformAdmin'])
  if (tokenErr) {
    return ResErr(cb, tokenErr)
  }
  // 业务操作
  let [err, ret] = await new UserModel().checkUserBySuffix(inparam.role, inparam.suffix, null)
  // 结果返回
  if (err) {
    return ResFail(cb, { ...errRes, err: err }, err.code)
  } else {
    return ResOK(cb, { ...res, payload: ret })
  }
}

/**
 * 检查昵称是否被占用
 */
const checkNickExist = async (e, c, cb) => {
  const errRes = { m: 'checkNickExist error'/*, input: e*/ }
  const res = { m: 'checkNickExist' }
  // 入参转换和校验
  const [jsonParseErr, inparam] = JSONParser(e && e.body)
  if (jsonParseErr) {
    return ResErr(cb, jsonParseErr)
  }
  if (!inparam.role || !inparam.displayName) {
    return ResFail(cb, { ...errRes, err: BizErr.InparamErr() }, BizErr.InparamErr().code)
  }
  // 身份令牌，只有管理员有权限
  const [tokenErr, token] = await Model.currentRoleToken(e, RoleCodeEnum['PlatformAdmin'])
  if (tokenErr) {
    return ResErr(cb, tokenErr)
  }
  // 业务操作
  let [err, ret] = await new UserModel().checkNickExist(inparam.role, inparam.displayName)
  // 结果返回
  if (err) {
    return ResFail(cb, { ...errRes, err: err }, err.code)
  } else {
    return ResOK(cb, { ...res, payload: ret })
  }
}

/**
 * 管理员列表
 */
const adminList = async (e, c, cb) => {
  // 只有管理员角色可操作
  const [tokenErr, token] = await Model.currentRoleToken(e, RoleCodeEnum['PlatformAdmin'])
  if (tokenErr) {
    return ResErr(cb, tokenErr)
  }
  // 业务操作
  const [err, admins] = await new UserModel().listAllAdmins(token)
  // 结果返回
  if (err) {
    return ResErr(cb, err)
  }
  return ResOK(cb, { payload: admins })
}

/**
 * 管理员个人中心
 */
const adminCenter = async (e, c, cb) => {
  // 只有管理员角色可操作
  const [tokenErr, token] = await Model.currentRoleToken(e, RoleCodeEnum['PlatformAdmin'])
  if (tokenErr) {
    return ResErr(cb, tokenErr)
  }
  // 业务操作
  const [err, admin] = await new UserModel().theAdmin(token)
  // 结果返回
  if (err) {
    return ResErr(cb, err)
  }
  return ResOK(cb, { payload: admin })
}

/**
 * 获取下级用户列表
 */
const childList = async (e, c, cb) => {
  // 入参校验
  const errRes = { m: 'childList err'/*, input: e*/ }
  const res = { m: 'childList' }
  const [paramsErr, params] = Model.pathParams(e)
  if (paramsErr) {
    return ResErr(cb, paramsErr)
  }
  if (paramsErr || !params.childRole || !params.userId) {
    return ResErr(cb, BizErr.InparamErr())
  }
  // 身份令牌
  const [tokenErr, token] = await Model.currentToken(e)
  if (tokenErr) {
    return ResErr(cb, tokenErr)
  }
  // 只能查看自己下级
  if (parseInt(token.role) > parseInt(params.childRole)) {
    return ResErr(cb, BizErr.InparamErr('no right'))
  }
  // 业务操作
  const [err, ret] = await new UserModel().listChildUsers(params, params.childRole)
  // 结果返回
  if (err) {
    return ResFail(cb, { ...errRes, err: err }, err.code)
  }
  // 查询每个用户余额
  for (let user of ret) {
    let [balanceErr, lastBill] = await new BillModel().checkUserBalance(user)
    user.balance = lastBill.lastBalance
    user.lastBill = lastBill
  }
  return ResOK(cb, { ...res, payload: ret })
}

/**
 * 更新密码
 */
const updatePassword = async (e, c, cb) => {
  const errRes = { m: 'updatePassword error'/*, input: e*/ }
  const res = { m: 'updatePassword' }
  // 入参转换和校验
  const [jsonParseErr, inparam] = JSONParser(e && e.body)
  if (jsonParseErr) {
    return ResErr(cb, jsonParseErr)
  }
  //检查参数是否合法
  let [checkAttError, errorParams] = new UserCheck().checkPassword(inparam)
  if (checkAttError) {
    Object.assign(checkAttError, { params: errorParams })
    return ResErr(cb, checkAttError)
  }
  // 身份令牌
  const [tokenErr, token] = await Model.currentToken(e)
  if (tokenErr) {
    return ResErr(cb, tokenErr)
  }
  // 只有管理员有权限
  if (token.role != RoleCodeEnum['PlatformAdmin'] && (token.userId != inparam.userId)) {
    return [BizErr.TokenErr('no right!'), 0]
  }
  // 查询用户
  const [queryErr, user] = await new UserModel().queryUserById(inparam.userId)
  if (queryErr) {
    return ResFail(cb, { ...errRes, err: queryErr }, err.code)
  }
  // 更新用户密码
  user.password = inparam.password
  user.passhash = Model.hashGen(user.password)
  const [err, ret] = await new UserModel().userUpdate(user)
  // 操作日志记录
  inparam.operateAction = '修改密码'
  inparam.operateToken = token
  new LogModel().addOperate(inparam, err, ret)
  // 结果返回
  if (err) {
    return ResFail(cb, { ...errRes, err: err }, err.code)
  } else {
    return ResOK(cb, { ...res, payload: ret })
  }
}

/**
 * 随机密码
 */
const randomPassword = (e, c, cb) => {
  const res = { m: 'randomPassword' }
  const passwd = Model.genPassword()
  return ResOK(cb, { ...res, payload: { generatedPassword: passwd } })
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
  eva,                          // 用于创建系统的第一个管理员账号
  userAuth,                     // 用户登录
  adminNew,                     // 新管理员
  adminList,                    // 管理员列表
  adminCenter,                  // 管理员个人中心
  userNew,                      // 创建新用户
  userGrabToken,                // 使用apiKey登录获取用户信息
  userChangeStatus,             // 变更用户状态
  childList,                    // 下级用户列表
  checkUserExist,               // 检查用户是否被占用
  checkSuffixExist,             // 检查前缀是否被占用
  checkNickExist,               // 检查昵称是否被占用

  updatePassword,               // 更新密码
  randomPassword                // 随机密码
}
