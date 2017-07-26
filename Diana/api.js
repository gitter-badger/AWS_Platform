import {
  Stream$,
  Success,
  Fail,
  Codes,
  JSONParser,
  Model,
  Tables,
  BillActionEnum,
  StatusEnum,
  GenderEnum,
  RoleCodeEnum,
  RoleEditProps,
  Trim,
  Pick,
  JwtVerify,
  GeneratePolicyDocument,
  MSNStatusEnum,
  BizErr
} from './lib/all'
import { RegisterAdmin, RegisterUser, LoginUser, UserGrabToken } from './biz/auth'
import {
  ListAllAdmins,
  ListChildUsers,
  ListAvalibleManagers,
  TheAdmin,
  AddGame,
  ListGames,
  DepositTo,
  WithdrawFrom,
  CheckMSN,
  FormatMSN,
  UserUpdate,
  GetUser,
  QueryUserById,
  QueryBillUser,
  CheckBalance,
  CheckUserBalance,
  ComputeWaterfall

} from './biz/dao'
import { UserModel } from './model/UserModel'
import { LogModel } from './model/LogModel'

const ResOK = (callback, res) => callback(null, Success(res))
const ResFail = (callback, res, code = Codes.Error) => callback(null, Fail(res, code))
const ResErr = (callback, err) => ResFail(callback, { err: err }, err.code)

/**
 * 创建游戏
 */
const gameNew = async (e, c, cb) => {
  const errRes = { m: 'gameNew err', input: e }
  const res = { m: 'gameNew' }
  const [jsonParseErr, gameInfo] = JSONParser(e && e.body)
  if (jsonParseErr) {
    return ResFail(cb, { ...errRes, err: jsonParseErr }, jsonParseErr.code)
  }
  const [addGameInfoErr, addGameRet] = await AddGame(gameInfo)
  if (addGameInfoErr) {
    return ResFail(cb, { ...errRes, err: addGameInfoErr }, addGameInfoErr.code)
  }
  return ResOK(cb, { ...res, payload: addGameRet })
}

/**
 * 游戏列表
 */
const gameList = async (e, c, cb) => {
  const errRes = { m: 'gamelist err', input: e }
  const res = { m: 'gamelist' }
  const [paramsErr, gameParams] = Model.pathParams(e)
  if (paramsErr) {
    return ResFail(cb, { ...errRes, err: paramsErr }, paramsErr.code)
  }
  const [err, ret] = await ListGames(gameParams)
  if (err) {
    return ResFail(cb, { ...errRes, err: err }, err.code)
  }
  return ResOK(cb, { ...res, payload: ret })
}

/**
 * 单个账单详情
 */
const billOne = async (e, c, cb) => {
  const [paramsErr, params] = Model.pathParams(e)
  if (paramsErr || !params.userId) {
    return ResErr(cb, paramsErr)
  }
  const [tokenErr, token] = await Model.currentToken(e)
  if (tokenErr) {
    return ResErr(cb, tokenErr)
  }
  const [queryErr, user] = await QueryUserById(params.userId)
  if (queryErr) {
    return ResErr(cb, queryErr)
  }
  const [balanceErr, balance] = await CheckBalance(token, user)
  if (balanceErr) {
    return ResErr(cb, balanceErr)
  }
  return ResOK(cb, {
    payload: {
      balance: balance,
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
  const [tokenErr, token] = await Model.currentToken(e)
  if (tokenErr) {
    return ResErr(cb, tokenErr)
  }

  const [queryErr, bills] = await ComputeWaterfall(token, params.userId)
  if (queryErr) {
    return ResErr(cb, queryErr)
  }
  return ResOK(cb, {
    payload: bills
  })
}

/*
  提点
  转点 操作
  1 fromUser是toUser的parent (非管理员)
  2.fromUser是管理员 因为管理员是所有用户的parent
  3. 管理员指定fromUser 和 toUser 此时也需要满足约束 1
  4. 当前的非管理员用户也可以代表自己的下级进行转点操作
*/

/**
 * 存点
 */
const depositPoints = async (e, c, cb) => {
  const errRes = { m: 'depositPoints err', input: e }
  const res = { m: 'depositPoints' }
  const [jsonParseErr, depositInfo] = JSONParser(e && e.body)
  if (jsonParseErr) {
    return ResErr(cb, jsonParseErr)
  }
  const [tokenErr, token] = await Model.currentToken(e)
  if (tokenErr) {
    return ResErr(cb, tokenErr)
  }
  // 依据token判断当前登录用户是否是管理员
  // 如果是 再看传人的body参数是否满足条件2和3
  // 最后,如果当前登录用户不是管理员
  const [queryErr, fromUser] = await QueryBillUser(token, depositInfo.fromUserId)
  if (queryErr) {
    return ResFail(cb, queryErr)
  }
  // 获取fromUser的当前余额
  const [userBalanceErr, userBalance] = await CheckUserBalance(fromUser)
  if (userBalanceErr) {
    return ResErr(cb, userBalanceErr)
  }
  const [depositBillErr, depositBillRet] = await DepositTo(fromUser, {
    ...depositInfo,
    amount: Math.min(userBalance, depositInfo.amount)
  })
  if (depositBillErr) {
    return ResErr(cb, depositBillErr)
  }
  return ResOK(cb, { ...res, payload: depositBillRet })
}
/**
 * 提点
 */
const withdrawPoints = async (e, c, cb) => {
  const errRes = { m: 'withdrawPoints err', input: e }
  const res = { m: 'withdrawPoints' }
  const [jsonParseErr, withdrawInfo] = JSONParser(e && e.body)
  if (jsonParseErr) {
    return ResFail(cb, { ...errRes, err: jsonParseErr }, jsonParseErr.code)
  }
  const [tokenErr, token] = await Model.currentToken(e)
  if (tokenErr) {
    return ResFail(cb, { ...errRes, err: tokenErr }, tokenErr.code)
  }
  const [queryErr, fromUser] = await QueryBillUser(token, withdrawInfo.fromUserId)
  if (queryErr) {
    return ResErr(cb, queryErr)
  }
  const [userBalanceErr, userBalance] = await CheckUserBalance(fromUser)
  if (userBalanceErr) {
    return ResErr(cb, userBalanceErr)
  }
  const [withdrawBillErr, withdrawBillRet] = await WithdrawFrom(fromUser, {
    ...withdrawInfo,
    amount: Math.min(userBalance, withdrawInfo.amount)
  })
  if (withdrawBillErr) {
    return ResFail(cb, { ...errRes, err: withdrawBillErr }, withdrawBillErr.code)
  }
  return ResOK(cb, { ...res, payload: withdrawBillRet })
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
  // 参数校验
  if (!inparam.pageSize || !inparam.role) {
    return ResFail(cb, { ...errRes, err: BizErr.InparamError() }, BizErr.InparamErr().code)
  }else{
    inparam.pageSize = parseInt(inparam.pageSize)
  }
  // 获取令牌，只有管理员有权限
  const [tokenErr, token] = await Model.currentRoleToken(e,RoleCodeEnum['PlatformAdmin'])
  if (tokenErr) {
    return ResErr(cb, tokenErr)
  }
  // 业务操作
  const [err, ret] = await new LogModel().query({
    IndexName: 'LogRoleIndex',
    Limit: inparam.pageSize,
    ExclusiveStartKey: inparam.startKey,
    ScanIndexForward: false,
    KeyConditionExpression: "#role = :role",
    ExpressionAttributeNames: {
      '#role': 'role'
    },
    ExpressionAttributeValues: {
      ':role': inparam.role + ''
    }
  })
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

  gameNew,                      // 新建游戏
  gameList,                     // 游戏列表

  billList,                     // 流水列表
  billOne,
  depositPoints,                // 存点
  withdrawPoints,               // 取点

  logList,                      // 日志列表
}
