import { ResOK, ResFail, ResErr, Codes, JSONParser, Model, RoleCodeEnum, Trim, Pick, JwtVerify, GeneratePolicyDocument, BizErr } from './lib/all'
import { LogModel } from './model/LogModel'
import { BillModel } from './model/BillModel'
import { UserModel } from './model/UserModel'

import { LogCheck } from './biz/LogCheck'
import { BillCheck } from './biz/BillCheck'

/**
 * 用户余额
 * 包含所剩余额
 * 包含出账金额
 */
const billOne = async (e, c, cb) => {
  // 获取入参
  const [paramsErr, params] = Model.pathParams(e)
  if (paramsErr || !params.userId) {
    return ResErr(cb, paramsErr)
  }
  // 身份令牌
  const [tokenErr, token] = await Model.currentToken(e)
  if (tokenErr) {
    return ResErr(cb, tokenErr)
  }
  // 查询用户
  const [queryErr, user] = await new UserModel().queryUserById(params.userId)
  if (queryErr) {
    return ResErr(cb, queryErr)
  }
  // 操作权限
  if (!Model.isAgent(user) && !Model.isPlatformAdmin(token) && !Model.isChild(token, user) && user.userId != token.userId) {
    return [BizErr.TokenErr('平台用户只有平台管理员/直属上级/自己能查看'), 0]
  }
  if (Model.isAgent(user) && !Model.isAgentAdmin(token) && !Model.isSubChild(token, user) && user.userId != token.userId) {
    return [BizErr.TokenErr('代理用户只有代理管理员/父辈/自己能查看'), 0]
  }
  // 查询余额
  const [balanceErr, balance] = await new BillModel().checkUserBalance(user)
  if (balanceErr) {
    return ResErr(cb, balanceErr)
  }
  // 查询出账
  const [outErr, out] = await new BillModel().checkUserOut(user)
  if (outErr) {
    return ResErr(cb, outErr)
  }
  // 返回数据
  return ResOK(cb, {
    payload: {
      balance: balance,
      out: out,
      userId: params.userId
    }
  })
}

/**
 * 用户账单列表
 */
const billList = async (e, c, cb) => {
  // 入参处理
  const [paramsErr, inparam] = Model.pathParams(e)
  if (paramsErr || !inparam.userId) {
    return ResErr(cb, paramsErr)
  }
  // 身份令牌
  const [tokenErr, token] = await Model.currentToken(e)
  if (tokenErr) {
    return ResErr(cb, tokenErr)
  }
  // 查询用户信息
  const [queryUserErr, user] = await new UserModel().queryUserById(inparam.userId)
  if (queryUserErr) {
    return [queryUserErr, 0]
  }
  // 操作权限
  if (!Model.isAgent(user) && !Model.isPlatformAdmin(token) && !Model.isChild(token, user) && user.userId != token.userId) {
    return [BizErr.TokenErr('平台用户只有平台管理员/直属上级/自己能查看'), 0]
  }
  if (Model.isAgent(user) && !Model.isAgentAdmin(token) && !Model.isSubChild(token, user) && user.userId != token.userId) {
    return [BizErr.TokenErr('代理用户只有代理管理员/父辈/自己能查看'), 0]
  }
  // 业务查询
  const [queryErr, bills] = await new BillModel().computeWaterfall(user.points, inparam.userId)
  if (queryErr) {
    return ResErr(cb, queryErr)
  }
  return ResOK(cb, { payload: bills })
}

/**
 * 转账，从一个账户到另一个账户
 */
const billTransfer = async (e, c, cb) => {
  const res = { m: 'billTransfer' }
  // 入参数据转换
  const [jsonParseErr, transferInfo] = JSONParser(e && e.body)
  if (jsonParseErr) {
    return ResErr(cb, jsonParseErr)
  }
  //检查参数是否合法
  let [checkAttError, errorParams] = new BillCheck().checkBill(transferInfo)
  if (checkAttError) {
    Object.assign(checkAttError, { params: errorParams })
    return ResErr(cb, checkAttError)
  }
  // 身份令牌
  const [tokenErr, token] = await Model.currentToken(e)
  if (tokenErr) {
    return ResErr(cb, tokenErr)
  }
  // 获取转账账户
  const fromUserId = transferInfo.fromUserId || token.userId
  const [queryErr, fromUser] = await new UserModel().queryUserById(fromUserId)
  if (queryErr) {
    return ResFail(cb, queryErr)
  }
  // 操作权限
  if (!Model.isAgent(fromUser) && !Model.isPlatformAdmin(token) && !Model.isChild(token, fromUser) && fromUser.userId != token.userId) {
    return [BizErr.TokenErr('平台用户只有平台管理员/直属上级/自己能操作'), 0]
  }
  if (Model.isAgent(fromUser) && !Model.isAgentAdmin(token) && !Model.isSubChild(token, fromUser) && fromUser.userId != token.userId) {
    return [BizErr.TokenErr('代理用户只有代理管理员/父辈/自己能操作'), 0]
  }
  // 获取目的账户
  const [queryErr2, toUser] = await new UserModel().getUserByName(transferInfo.toRole, transferInfo.toUser)
  if (queryErr2) {
    return ResFail(cb, queryErr2)
  }
  // 设置操作人TOKEN
  fromUser.operatorToken = token
  // 获取fromUser的当前余额
  const [userBalanceErr, userBalance] = await new BillModel().checkUserBalance(fromUser)
  if (userBalanceErr) {
    return ResErr(cb, userBalanceErr)
  }
  // 开始转账业务
  const [depositBillErr, depositBillRet] = await new BillModel().billTransfer(fromUser, {
    ...transferInfo,
    toLevel: toUser.level,
    toDisplayName: toUser.displayName,
    amount: Math.min(userBalance, transferInfo.amount)
  })
  if (depositBillErr) {
    return ResErr(cb, depositBillErr)
  }
  return ResOK(cb, { ...res, payload: depositBillRet })
}

/**
 * 日志列表，接口编号：
 */
const logList = async (e, c, cb) => {
  // 入参数据
  const res = { m: 'logList' }
  const [jsonParseErr, inparam] = JSONParser(e && e.body)
  if (jsonParseErr) {
    return ResFail(cb, { ...res, err: jsonParseErr }, jsonParseErr.code)
  }
  //检查参数是否合法
  let [checkAttError, errorParams] = new LogCheck().checkPage(inparam)
  if (checkAttError) {
    Object.assign(checkAttError, { params: errorParams })
    return ResErr(cb, checkAttError)
  }
  // 获取身份令牌
  const [tokenErr, token] = await Model.currentToken(e)
  if (tokenErr) {
    return ResErr(cb, tokenErr)
  }
  // 平台管理员或代理管理员
  if (Model.isPlatformAdmin(token) || Model.isAgentAdmin(token)) {
    inparam.parent = null
  }
  // 线路商 
  else if (Model.isManager(token)) {
    inparam.parent = token.userId
  }
  // 代理
  else if (Model.isAgent(token)) {
    inparam.parent = token.userId
  }
  else {
    return [BizErr.TokenErr('身份权限错误'), 0]
  }

  // 业务操作
  let [err, ret] = await new LogModel().logPage(inparam)
  // 结果返回
  if (err) {
    return ResFail(cb, { ...res, err: err }, err.code)
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

export {
  jwtverify,                    // 用于进行token验证的方法

  billList,                     // 流水列表
  billOne,                      // 用户余额
  billTransfer,                 // 转账

  logList                       // 日志列表
}