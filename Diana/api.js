import {
  Success,
  Fail,
  Codes,
  JSONParser,
  Model,
  Tables,
  GameTypeEnum,
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
import { GameModel } from './model/GameModel'
import { LogModel } from './model/LogModel'
import { BillModel } from './model/BillModel'
import { UserModel } from './model/UserModel'
import { CompanyModel } from './model/CompanyModel'

const ResOK = (callback, res) => callback(null, Success(res))
const ResFail = (callback, res, code = Codes.Error) => callback(null, Fail(res, code))
const ResErr = (callback, err) => ResFail(callback, { err: err }, err.code)

/**
 * 创建游戏
 */
const gameNew = async (e, c, cb) => {
  // 入参转换
  const errRes = { m: 'gameNew err', input: e }
  const res = { m: 'gameNew' }
  const [jsonParseErr, gameInfo] = JSONParser(e && e.body)
  if (jsonParseErr) {
    return ResErr(cb, jsonParseErr)
  }

  // 获取令牌，只有管理员有权限
  const [tokenErr, token] = await Model.currentRoleToken(e, RoleCodeEnum['PlatformAdmin'])
  if (tokenErr) {
    return ResErr(cb, tokenErr)
  }

  // 参数合法性校验
  if (!GameTypeEnum[gameInfo.gameType]) {
    return ResErr(cb, [BizErr.ParamErr('游戏类型不能为空'), 0])
  }
  if (!gameInfo.gameName) {
    return ResErr(cb, [BizErr.ParamErr('游戏名称不能为空'), 0])
  }
  // if (!_.isNumber(kindId)) {
  //     return [BizErr.ParamErr('kindId should provided and kindId cant parse to number')]
  // }
  // 业务操作
  const [addGameInfoErr, addGameRet] = await new GameModel().addGame(gameInfo)

  // 操作日志记录
  gameInfo.operateAction = '创建游戏'
  gameInfo.operateToken = token
  new LogModel().addOperate(gameInfo, addGameInfoErr, addGameRet)

  if (addGameInfoErr) {
    return ResFail(cb, { ...errRes, err: addGameInfoErr }, addGameInfoErr.code)
  }
  return ResOK(cb, { ...res, payload: addGameRet })
}

/**
 * 游戏列表
 */
const gameList = async (e, c, cb) => {
  const errRes = { m: 'gamelist err'/*, input: e*/ }
  const res = { m: 'gamelist' }
  // const [paramsErr, gameParams] = Model.pathParams(e)
  // if (paramsErr) {
  //   return ResErr(cb, jsonParseErr)
  // }
  const [jsonParseErr, gameParams] = JSONParser(e && e.body)
  if (jsonParseErr) {
    return ResErr(cb, jsonParseErr)
  }
  let [err, ret] = [1, 1]
  if (!gameParams.parent || gameParams.parent == RoleCodeEnum['PlatformAdmin'] || gameParams.parent == '01') {
    [err, ret] = await new GameModel().listGames(gameParams)
  } else {
    [err, ret] = await new UserModel().queryUserById(gameParams.parent)
  }
  if (err) {
    return ResFail(cb, { ...errRes, err: err }, err.code)
  }
  if (gameParams.parent) {
    ret = ret.gameList
  }
  return ResOK(cb, { ...res, payload: ret })
}

/**
 * 单个游戏
 */
const gameOne = async (e, c, cb) => {
  const errRes = { m: 'gameOne err'/*, input: e*/ }
  const res = { m: 'gameOne' }
  const [paramsErr, gameParams] = Model.pathParams(e)
  if (paramsErr) {
    return ResErr(cb, jsonParseErr)
  }
  let [err, ret] = await new GameModel().getOne(gameParams.gameType, gameParams.gameId)
  if (err) {
    return ResFail(cb, { ...errRes, err: err }, err.code)
  }
  return ResOK(cb, { ...res, payload: ret })
}

/**
 * 游戏状态变更，接口编号：
 */
const gameChangeStatus = async (e, c, cb) => {
  // 数据输入，转换，校验
  const errRes = { m: 'gameChangeStatus error' }
  const res = { m: 'gameChangeStatus' }
  const [jsonParseErr, inparam] = JSONParser(e && e.body)
  if (jsonParseErr) {
    return ResErr(cb, jsonParseErr)
  }
  // 参数校验
  if (!inparam.gameType || !inparam.gameId) {
    return ResFail(cb, { ...errRes, err: BizErr.InparamErr() }, BizErr.InparamErr().code)
  }
  // 获取令牌，只有管理员有权限
  const [tokenErr, token] = await Model.currentRoleToken(e, RoleCodeEnum['PlatformAdmin'])
  if (tokenErr) {
    return ResErr(cb, tokenErr)
  }
  // 业务操作
  const [err, ret] = await new GameModel().changeStatus(inparam.gameType, inparam.gameId, inparam.status)
  if (err) {
    return ResFail(cb, { ...errRes, err: err }, err.code)
  } else {
    return ResOK(cb, { ...res, payload: ret })
  }
}

/**
 * 用户余额
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
  const [queryErr, user] = await new UserModel().queryUserById(params.userId)
  if (queryErr) {
    return ResErr(cb, queryErr)
  }
  const [balanceErr, balance] = await new BillModel().checkBalance(token, user)
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
  // 参数校验
  if (!inparam.pageSize || !inparam.role) {
    return ResFail(cb, { ...errRes, err: BizErr.InparamErr() }, BizErr.InparamErr().code)
  } else {
    inparam.pageSize = parseInt(inparam.pageSize)
  }
  // 获取令牌，只有管理员有权限
  const [tokenErr, token] = await Model.currentRoleToken(e, RoleCodeEnum['PlatformAdmin'])
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
  const errRes = { m: 'companyOne err'/*, input: e*/ }
  const res = { m: 'companyOne' }
  const [paramsErr, companyParams] = Model.pathParams(e)
  if (paramsErr) {
    return ResErr(cb, jsonParseErr)
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
  // 参数校验
  if (!inparam.companyName || !inparam.companyId) {
    return ResFail(cb, { ...errRes, err: BizErr.InparamErr() }, BizErr.InparamErr().code)
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
  gameChangeStatus,             // 游戏状态变更
  gameOne,                      // 单个游戏

  companyNew,                   // 新建厂商
  companyList,                  // 游戏厂商
  companyOne,                   // 单个厂商
  companyChangeStatus,          // 厂商状态变更

  billList,                     // 流水列表
  billOne,                      // 用户余额
  billTransfer,                 // 转账

  logList                       // 日志列表
}