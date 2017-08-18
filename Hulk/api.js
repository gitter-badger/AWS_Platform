import {
  Success,
  Fail,
  Codes,
  JSONParser,
  Model,
  Tables,
  StatusEnum,
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
import { BillModel } from './model/BillModel'
import { UserModel } from './model/UserModel'

import { LogCheck } from './biz/LogCheck'
import { BillCheck } from './biz/BillCheck'

const ResOK = (callback, res) => callback(null, Success(res))
const ResFail = (callback, res, code = Codes.Error) => callback(null, Fail(res, code))
const ResErr = (callback, err) => ResFail(callback, { err: err }, err.code)

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
  // 查询余额
  const [balanceErr, balance] = await new BillModel().checkBalance(token, user)
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
 * 账单列表
 */
const billList = async (e, c, cb) => {
  // 查询出当前详情页面的所属用户的交易记录列表
  // 根据其长度 进行n次
  const [paramsErr, params] = Model.pathParams(e)
  if (paramsErr || !params.userId) {
    return ResErr(cb, paramsErr)
  }
  // 身份令牌校验
  const [tokenErr, token] = await Model.currentToken(e)
  if (tokenErr) {
    return ResErr(cb, tokenErr)
  }
  // 业务查询
  const [queryErr, bills] = await new BillModel().computeWaterfall(token, params.userId)
  if (queryErr) {
    return ResErr(cb, queryErr)
  }
  return ResOK(cb, { payload: bills })
}

/*
  提点 注：fromUserId是转账源，toUser是转账终点
  转点 操作
  1 fromUser是toUser的parent (非管理员)
  2.fromUser是管理员 因为管理员是所有用户的parent
  3. 管理员指定fromUser 和 toUser 此时也需要满足约束 1
  4. 当前的非管理员用户也可以代表自己的下级进行转点操作
*/

/**
 * 转账
 */
const billTransfer = async (e, c, cb) => {
  const errRes = { m: 'billTransfer err'/*, input: e*/ }
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
  const [queryErr, fromUser] = await new BillModel().queryBillUser(token, transferInfo.fromUserId)
  if (queryErr) {
    return ResFail(cb, queryErr)
  }
  fromUser.operatorToken = token
  // 获取fromUser的当前余额
  const [userBalanceErr, userBalance] = await new BillModel().checkUserBalance(fromUser)
  if (userBalanceErr) {
    return ResErr(cb, userBalanceErr)
  }
  const [depositBillErr, depositBillRet] = await new BillModel().billTransfer(fromUser, {
    ...transferInfo,
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
  // 数据输入，转换，校验
  const errRes = { m: 'logList error' }
  const res = { m: 'logList' }
  const [jsonParseErr, inparam] = JSONParser(e && e.body)
  if (jsonParseErr) {
    return ResFail(cb, { ...errRes, err: jsonParseErr }, jsonParseErr.code)
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
  //只能是管理员或线路商
  if (token.role == RoleCodeEnum['PlatformAdmin']) {
    inparam.parent = null
  } else if (token.role == RoleCodeEnum['Manager']) {
    inparam.parent = token.userId
  } else {
    return [BizErr.TokenErr('must admin/manager token'), 0]
  }

  // 业务操作
  let [err, ret] = await new LogModel().logPage(inparam)
  // 结果返回
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

  billList,                     // 流水列表
  billOne,                      // 用户余额
  billTransfer,                 // 转账

  logList                       // 日志列表
}