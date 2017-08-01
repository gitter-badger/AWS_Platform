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
import { CaptchaModel } from './model/CaptchaModel'
import { MsnModel } from './model/MsnModel'
import { UserModel } from './model/UserModel'
import { LogModel } from './model/LogModel'
import { pushUserInfo } from "./lib/TcpUtil"
import { BillModel } from './model/BillModel'

import { UserCheck } from './biz/UserCheck'
import { CaptchaCheck } from './biz/CaptchaCheck'
import { MsnCheck } from './biz/MsnCheck'


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
 * 接口编号：2
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
  return ResOK(cb, { ...res, payload: resgisterUserRet })
  let pushInfo = {
    name: resgisterUserRet.username,
    role: resgisterUserRet.role,
    id: resgisterUserRet.userId,
    nickName: resgisterUserRet.displayName,
    headPic: "00",
    parentId: resgisterUserRet.parent
  }
  //推送信息给A3服务器
  // pushUserInfo(pushInfo)

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
  // 身份令牌
  const [tokenErr, token] = await Model.currentToken(e)
  if (tokenErr) {
    return ResErr(cb, tokenErr)
  }
  // 只有管理员有权限
  if (token.role != RoleCodeEnum['PlatformAdmin']) {
    return [BizErr.TokenErr('must admin token'), 0]
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
  // 身份令牌
  const [tokenErr, token] = await Model.currentToken(e)
  if (tokenErr) {
    return ResErr(cb, tokenErr)
  }
  // 只有管理员有权限
  if (token.role != RoleCodeEnum['PlatformAdmin']) {
    return [BizErr.TokenErr('must admin token'), 0]
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
 * 获取商户信息
 */
const merchantOne = async (e, c, cb) => {
  // 入参校验
  const errRes = { m: 'merchantOne err'/*, input: e*/ }
  const res = { m: 'merchantOne' }
  const [paramsErr, params] = Model.pathParams(e)
  if (paramsErr || !params.id) {
    return ResFail(cb, { ...errRes, err: paramsErr }, paramsErr.code)
  }
  const [tokenErr, token] = await Model.currentToken(e)
  if (tokenErr) {
    return ResFail(cb, { ...errRes, err: tokenErr }, tokenErr.code)
  }
  // 业务操作
  const [merchantErr, merchant] = await new UserModel().getUser(params.id, RoleCodeEnum['Merchant'])
  // 结果返回
  if (merchantErr) {
    return ResFail(cb, { ...errRes, err: merchantErr }, merchantErr.code)
  }
  return ResOK(cb, { ...res, payload: merchant })
}

/**
 * 获取下级商户列表
 */
const merchantList = async (e, c, cb) => {
  // 入参校验
  const errRes = { m: 'merchantList err'/*, input: e*/ }
  const res = { m: 'merchantList' }
  const [tokenErr, token] = await Model.currentToken(e)
  if (tokenErr) {
    return ResFail(cb, { ...errRes, err: tokenErr }, tokenErr.code)
  }
  // 业务操作
  const [err, ret] = await new UserModel().listChildUsers(token, RoleCodeEnum.Merchant)
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
 * 更新商户
 */
const merchantUpdate = async (e, c, cb) => {
  // 入参校验
  const errRes = { m: 'merchantUpdate err'/*, input: e*/ }
  const res = { m: 'merchantUpdate' }
  const [paramsErr, params] = Model.pathParams(e)
  if (paramsErr || !params.id) {
    return ResFail(cb, { ...errRes, err: paramsErr }, paramsErr.code)
  }
  const [jsonParseErr, merchantInfo] = JSONParser(e && e.body)
  if (jsonParseErr) {
    return ResFail(cb, { ...errRes, err: jsonParseErr }, jsonParseErr.code)
  }
  //检查参数是否合法
  let [checkAttError, errorParams] = new UserCheck().checkUser(merchantInfo)
  if (checkAttError) {
    Object.assign(checkAttError, { params: errorParams })
    return ResErr(cb, checkAttError)
  }
  // 身份令牌校验
  const [tokenErr, token] = await Model.currentToken(e)
  if (tokenErr) {
    return ResFail(cb, { ...errRes, err: tokenErr }, tokenErr.code)
  }
  // 业务操作
  const [merchantErr, merchant] = await new UserModel().getUser(params.id, RoleCodeEnum['Merchant'])
  if (merchantErr) {
    return ResFail(cb, { ...errRes, err: merchantErr }, merchantErr.code)
  }
  // 获取更新属性和新密码HASH
  const Merchant = {
    ...merchant, ...Pick(merchantInfo, RoleEditProps[RoleCodeEnum['Manager']])
  }
  Merchant.passhash = Model.hashGen(Merchant.password)
  // 业务操作
  const [updateErr, updateRet] = await new UserModel().userUpdate(Merchant)
  // 操作日志记录
  params.operateAction = '更新商户信息'
  params.operateToken = token
  new LogModel().addOperate(params, updateErr, updateRet)
  // 结果返回
  if (updateErr) {
    return ResFail(cb, { ...errRes, err: updateErr }, updateErr.code)
  }
  return ResOK(cb, { ...res, payload: updateRet })
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
  let [checkAttError, errorParams] = new UserCheck().checkUser(inparam)
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
  console.info(user)
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

/**
 * 获取线路号列表
 */
const msnList = async (e, c, cb) => {
  // 数据输入，转换，校验
  const errRes = { m: 'msnList error' }
  const res = { m: 'msnList' }
  if (!e) { e = {} }
  if (!e.body) { e.body = {} }
  const [jsonParseErr, inparam] = JSONParser(e && e.body)
  if (jsonParseErr) {
    return ResFail(cb, { ...errRes, err: jsonParseErr }, jsonParseErr.code)
  }
  // 业务操作
  const [err, ret] = await new MsnModel().scan()
  if (err) {
    return ResFail(cb, { ...errRes, err: err }, err.code)
  } else {
    let arr = new Array()
    let flag = true
    for (let i = 1; i < 1000; i++) {
      flag = true
      for (let item of ret.Items) {
        if (i == parseInt(item.msn)) {
          flag = false
        }
      }
      if (flag) {
        arr.push({ msn: i, status: 0 })
      }
    }
    ret.Items.push(...arr)
    // 结果返回
    return ResOK(cb, { ...res, payload: ret })
  }
}
/**
 * 检查线路号是否可用
 */
const checkMsn = async (e, c, cb) => {
  // 入参校验
  const errRes = { m: 'checkMsn err'/*, input: e*/ }
  const res = { m: 'checkMsn' }
  const [paramErr, params] = Model.pathParams(e)
  if (paramErr) {
    return ResFail(cb, { ...errRes, err: paramErr }, paramErr.code)
  }
  // 业务操作
  const [checkErr, checkRet] = await new MsnModel().checkMSN(params)
  if (checkErr) {
    return ResFail(cb, { ...errRes, err: checkErr }, checkErr.code)
  }
  // 结果返回
  return ResOK(cb, { ...res, payload: { avalible: Boolean(checkRet) } })
}
/**
 * 随机线路号
 */
const msnRandom = async (e, c, cb) => {
  // 数据输入，转换，校验
  const errRes = { m: 'msnRandom error' }
  const res = { m: 'msnRandom' }
  // 业务操作
  const [err, ret] = await new MsnModel().scan()
  if (err) {
    return ResFail(cb, { ...errRes, err: err }, err.code)
  } else {
    // 所有线路号都被占用
    if (ret.Items.length >= 999) {
      return ResFail(cb, { ...errRes, err: BizErr.MsnFullError() }, BizErr.MsnFullError().code)
    }
    // 所有占用线路号组成数组
    let msnArr = new Array()
    for (let item of ret.Items) {
      msnArr.push(parseInt(item.msn))
    }
    // 随机生成线路号
    let randomMsn = randomNum(1, 999)
    // 判断随机线路号是否已被占用
    while (msnArr.indexOf(randomMsn) != -1) {
      randomMsn = randomNum(1, 999)
    }
    // 结果返回
    return ResOK(cb, { ...res, payload: randomMsn })
  }
}
/**
 * 锁定/解锁线路号
 */
const lockmsn = async (e, c, cb) => {
  // 入参校验
  const errRes = { m: 'lockmsn err'/*, input: e*/ }
  const res = { m: 'lockmsn' }
  const [paramErr, params] = Model.pathParams(e)
  if (paramErr) {
    return ResFail(cb, { ...errRes, err: paramErr }, paramErr.code)
  }
  //检查参数是否合法
  let [checkAttError, errorParams] = new MsnCheck().checkMsnLock(params)
  if (checkAttError) {
    Object.assign(checkAttError, { params: errorParams })
    return ResErr(cb, checkAttError)
  }
  // 获取令牌,只有管理员有权限
  const [tokenErr, token] = await Model.currentRoleToken(e, RoleCodeEnum['PlatformAdmin'])
  if (tokenErr) {
    return ResErr(cb, tokenErr)
  }
  // 查询msn
  const [queryErr, queryRet] = await new MsnModel().query({
    KeyConditionExpression: '#msn = :msn',
    ExpressionAttributeNames: {
      '#msn': 'msn',
    },
    ExpressionAttributeValues: {
      ':msn': params.msn
    }
  })
  // 锁定
  if (params.status == MSNStatusEnum.Locked) {
    if (queryRet.Items.length == 0) {
      const msn = { msn: params.msn, userId: '0', status: MSNStatusEnum.Locked }
      const [err, ret] = await new MsnModel().putItem(msn)

      // 操作日志记录
      params.operateAction = '锁定线路号'
      params.operateToken = token
      new LogModel().addOperate(params, err, ret)

      if (err) {
        return ResFail(cb, { ...errRes, err: err }, err.code)
      } else {
        return ResOK(cb, { ...res, payload: msn })
      }
    }
    else {
      return ResFail(cb, { ...errRes, err: BizErr.MsnUsedError() }, BizErr.MsnUsedError().code)
    }
  }
  // 解锁
  else {
    if (queryRet.Items.length == 1 && queryRet.Items[0].status == 2) {
      const [err, ret] = await new MsnModel().deleteItem({
        Key: {
          msn: params.msn,
          userId: '0'
        }
      })

      // 操作日志记录
      params.operateAction = '解锁线路号'
      params.operateToken = token
      new LogModel().addOperate(params, err, ret)

      if (err) {
        return ResFail(cb, { ...errRes, err: err }, err.code)
      } else {
        return ResOK(cb, { ...res, payload: params.msn })
      }
    }
    else {
      return ResFail(cb, { ...errRes, err: BizErr.MsnNotExistError() }, BizErr.MsnNotExistError().code)
    }
  }
}

/**
 * 获取登录验证码，接口编号：
 */
const captcha = async (e, c, cb) => {
  // 数据输入，转换，校验
  const errRes = { m: 'captcha error' }
  const res = { m: 'captcha' }
  const [jsonParseErr, inparam] = JSONParser(e && e.body)
  if (jsonParseErr) {
    return ResFail(cb, { ...errRes, err: jsonParseErr }, jsonParseErr.code)
  }
  //检查参数是否合法
  let [checkAttError, errorParams] = new CaptchaCheck().checkCaptcha(inparam)
  if (checkAttError) {
    Object.assign(checkAttError, { params: errorParams })
    return ResErr(cb, checkAttError)
  }
  // 业务操作
  inparam.code = randomNum(1000, 9999)
  const [err, ret] = await new CaptchaModel().putItem(inparam)
  // 结果返回
  if (err) {
    return ResFail(cb, { ...errRes, err: err }, err.code)
  } else {
    return ResOK(cb, { ...res, payload: inparam })
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
    console.log(JSON.stringify(err), JSON.stringify(userInfo))
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

// 随机数
function randomNum(min, max) {
  var range = max - min
  var rand = Math.random()
  var num = min + Math.round(rand * range)
  return num
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

  managerList,                  // 建站商列表
  managerOne,                   // 建站商详情
  managerUpdate,                // 编辑某个建站商
  avalibleManagers,             // 当前可用的建站商

  merchantList,                 // 商户列表
  merchantOne,                  // 商户
  merchantUpdate,               // 编辑某个商户

  msnList,                      // 线路号列表
  checkMsn,                     // 检查msn是否被占用
  lockmsn,                      // 锁定/解锁msn
  msnRandom,                    // 随机线路号
  captcha,                      // 获取验证码

  updatePassword,               // 更新密码
  randomPassword                // 随机密码
}
