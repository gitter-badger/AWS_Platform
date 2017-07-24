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
import { CaptchaModel } from './model/CaptchaModel'
import { MsnModel } from './model/MsnModel'
// import { Util } from "athena"

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
  // 生成第一个管理员业务
  const token = userInfo  // TODO 该接口不需要TOKEN，默认设置
  const [registerUserErr, resgisterUserRet] = await RegisterAdmin(token, Model.addSourceIP(e, userInfo))
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
  const [jsonParseErr, userInfo] = JSONParser(e && e.body)
  if (jsonParseErr) {
    return ResErr(cb, jsonParseErr)
  }
  const [tokenErr, token] = await Model.currentToken(e)
  if (tokenErr) {
    return ResErr(cb, tokenErr)
  }

  const [registAdminErr, adminUser] = await RegisterAdmin(token, Model.addSourceIP(e, userInfo))
  if (registAdminErr) {
    return ResErr(cb, registAdminErr)
  }
  return ResOK(cb, { payload: adminUser })
}
/**
 * 用户注册
 */
const userNew = async (e, c, cb) => {
  const errRes = { m: 'userNew error', input: e }
  const res = { m: 'userNew' }
  // 从POST 的body中获取提交数据
  const [jsonParseErr, userInfo] = JSONParser(e && e.body)
  if (jsonParseErr) {
    return ResErr(cb, jsonParseErr)
  }
  const [tokenErr, token] = await Model.currentToken(e)
  if (tokenErr) {
    return ResErr(cb, tokenErr)
  }

  const [registerUserErr, resgisterUserRet] = await RegisterUser(token, Model.addSourceIP(e, userInfo))
  if (registerUserErr) {
    return ResFail(cb, { ...errRes, err: registerUserErr }, registerUserErr.code)
  }

  return ResOK(cb, { ...res, payload: resgisterUserRet })
}

/**
 * 用户登录
 */
const userAuth = async (e, c, cb) => {
  const errRes = { m: 'userNew error', input: e }
  const res = {
    m: 'userAuth'
  }
  const [jsonParseErr, userLoginInfo] = JSONParser(e && e.body)
  if (jsonParseErr) {
    return ResFail(cb, { ...errRes, err: jsonParseErr }, jsonParseErr.code)
  }
  // 检查验证码
  let suffix = 'Platform'
  if (userLoginInfo.suffix) {
    suffix = userLoginInfo.suffix
  }
  const relKey = suffix + '_' + userLoginInfo.username
  const [err, ret] = await new CaptchaModel().query({
    KeyConditionExpression: 'relKey = :relKey and #usage = :usage',
    FilterExpression: 'code = :code',
    ExpressionAttributeNames: {
      '#usage': 'usage'
    },
    ExpressionAttributeValues: {
      ':relKey': relKey,
      ':usage': 'login',
      ':code': parseInt(userLoginInfo.captcha)
    }
  })
  if (err) {
    return ResFail(cb, { ...errRes, err: err }, err.code)
  } else if (ret.Items.length == 0) {
    return ResFail(cb, { ...errRes, err: BizErr.CaptchaErr() }, BizErr.CaptchaErr().code)
  }
  // 用户登录
  const [loginUserErr, loginUserRet] = await LoginUser(Model.addSourceIP(e, userLoginInfo))
  if (loginUserErr) {
    return ResFail(cb, { ...errRes, err: loginUserErr }, loginUserErr.code)
  }
  return ResOK(cb, { ...res, payload: loginUserRet })
}

/**
 * 获取用户TOKEN
 */
const userGrabToken = async (e, c, cb) => {
  const errRes = {
    m: 'managerList error',
    input: e
  }
  const res = {
    m: 'managerList'
  }
  // username suffix role and apiKey
  const [jsonParseErr, userInfo] = JSONParser(e && e.body)
  if (jsonParseErr) {
    return ResFail(cb, { ...errRes, err: jsonParseErr }, jsonParseErr.code)
  }

  const [tokenErr, userToken] = await UserGrabToken(Model.addSourceIP(e, userInfo))
  if (tokenErr) {
    return ResFail(cb, { ...errRes, err: tokenErr }, tokenErr.code)
  }
  return ResOK(cb, { ...res, payload: userToken })

}

/**
 * 管理员列表
 */
const adminList = async (e, c, cb) => {
  const [tokenErr, token] = await Model.currentToken(e)
  if (tokenErr) {
    return ResErr(cb, tokenErr)
  }
  // check the token  must admin
  const [err, admins] = await ListAllAdmins(token)
  if (err) {
    return ResErr(cb, err)
  }
  return ResOK(cb, { payload: admins })
}

/**
 * 管理员个人中心
 */
const adminCenter = async (e, c, cb) => {
  const [tokenErr, token] = await Model.currentToken(e)
  if (tokenErr) {
    return ResErr(cb, tokenErr)
  }
  const [err, admin] = await TheAdmin(token)
  if (err) {
    return ResErr(cb, err)
  }
  return ResOK(cb, { payload: admin })
}

/**
 * 建站商列表
 */
const managerList = async (e, c, cb) => {
  const errRes = { m: 'managerList error', input: e }
  const res = { m: 'managerList' }
  const [tokenErr, token] = await Model.currentToken(e)
  if (tokenErr) {
    return ResErr(cb, tokenErr)
  }
  const [err, ret] = await ListChildUsers(token, RoleCodeEnum.Manager)
  if (err) {
    return ResFail(cb, { ...errRes, err: err }, err.code)
  }
  return ResOK(cb, { ...res, payload: ret })
}
/**
 * 获取管理员信息
 */
const managerOne = async (e, c, cb) => {
  const errRes = { m: 'managerOne err', input: e }
  const res = { m: 'managerOne' }
  const [paramsErr, params] = Model.pathParams(e)
  if (paramsErr || !params.id) {
    return ResFail(cb, { ...errRes, err: paramsErr }, paramsErr.code)
  }
  const [tokenErr, token] = await Model.currentToken(e)
  if (tokenErr) {
    return ResFail(cb, { ...errRes, err: tokenErr }, tokenErr.code)
  }

  const [managerErr, manager] = await GetUser(params.id, RoleCodeEnum['Manager'])
  if (managerErr) {
    return ResFail(cb, { ...errRes, err: managerErr }, managerErr.code)
  }
  return ResOK(cb, { ...res, payload: manager })
}
/**
 * 更新管理员信息
 */
const managerUpdate = async (e, c, cb) => {
  const errRes = { m: 'managerUpdate err', input: e }
  const res = { m: 'managerUpdate', input: e }
  const [paramsErr, params] = Model.pathParams(e)
  if (paramsErr || !params.id) {
    return ResFail(cb, { ...errRes, err: paramsErr }, paramsErr.code)
  }
  const [tokenErr, token] = await Model.currentToken(e)
  if (tokenErr) {
    return ResFail(cb, { ...errRes, err: tokenErr }, tokenErr.code)
  }
  const [managerErr, manager] = await GetUser(params.id, RoleCodeEnum['Manager'])
  if (managerErr) {
    return ResFail(cb, { ...errRes, err: managerErr }, managerErr.code)
  }
  const [jsonParseErr, managerInfo] = JSONParser(e && e.body)
  if (jsonParseErr) {
    return ResFail(cb, { ...errRes, err: jsonParseErr }, jsonParseErr.code)
  }
  const Manager = {
    ...manager,
    ...Pick(managerInfo, RoleEditProps[RoleCodeEnum['Manager']])
  }
  const [updateErr, updateRet] = await UserUpdate(Manager)
  if (updateErr) {
    return ResFail(cb, { ...errRes, err: updateErr }, updateErr.code)
  }
  return ResOK(cb, { ...res, payload: updateRet })
}

/**
 * 获取商户信息
 */
const merchantOne = async (e, c, cb) => {
  const errRes = { m: 'merchantOne err', input: e }
  const res = { m: 'merchantOne' }
  const [paramsErr, params] = Model.pathParams(e)

  if (paramsErr || !params.id) {
    return ResFail(cb, { ...errRes, err: paramsErr }, paramsErr.code)
  }
  const [tokenErr, token] = await Model.currentToken(e)
  if (tokenErr) {
    return ResFail(cb, { ...errRes, err: tokenErr }, tokenErr.code)
  }

  const [merchantErr, merchant] = await GetUser(params.id, RoleCodeEnum['Merchant'])
  if (merchantErr) {
    return ResFail(cb, { ...errRes, err: merchantErr }, merchantErr.code)
  }
  return ResOK(cb, { ...res, payload: merchant })
}

/**
 * 获取下级商户列表
 */
const merchantList = async (e, c, cb) => {

  const errRes = {
    m: 'merchantList err',
    input: e
  }
  const res = {
    m: 'merchantList'
  }
  const [tokenErr,
    token] = await Model.currentToken(e)
  if (tokenErr) {
    return ResFail(cb, {
      ...errRes,
      err: tokenErr
    }, tokenErr.code)
  }
  const [err,
    ret] = await ListChildUsers(token, RoleCodeEnum.Merchant)
  if (err) {
    return ResFail(cb, {
      ...errRes,
      err: err
    }, err.code)
  }
  return ResOK(cb, {
    ...res,
    payload: ret
  })

}
const merchantUpdate = async (e, c, cb) => {
  const errRes = {
    m: 'merchantUpdate err',
    input: e
  }
  const res = {
    m: 'merchantUpdate'
  }
  const [paramsErr,
    params] = Model.pathParams(e)
  if (paramsErr || !params.id) {
    return ResFail(cb, {
      ...errRes,
      err: paramsErr
    }, paramsErr.code)
  }
  const [tokenErr,
    token] = await Model.currentToken(e)
  if (tokenErr) {
    return ResFail(cb, {
      ...errRes,
      err: tokenErr
    }, tokenErr.code)
  }

  const [merchantErr,
    merchant] = await GetUser(params.id, RoleCodeEnum['Merchant'])
  if (merchantErr) {
    return ResFail(cb, {
      ...errRes,
      err: merchantErr
    }, merchantErr.code)
  }
  const [jsonParseErr,
    merchantInfo] = JSONParser(e && e.body)
  if (jsonParseErr) {
    return ResFail(cb, {
      ...errRes,
      err: jsonParseErr
    }, jsonParseErr.code)
  }
  const Merchant = {
    ...merchant,
    ...Pick(merchantInfo, RoleEditProps[RoleCodeEnum['Manager']])
  }
  const [updateErr,
    updateRet] = await UserUpdate(Merchant)
  if (updateErr) {
    return ResFail(cb, {
      ...errRes,
      err: updateErr
    }, updateErr.code)
  }
  return ResOK(cb, {
    ...res,
    payload: updateRet
  })
}
const randomPassword = (e, c, cb) => {
  const res = {
    m: 'randomPassword'
  }
  const passwd = Model.genPassword()
  return ResOK(cb, {
    ...res,
    payload: {
      generatedPassword: passwd
    }
  })
}
const avalibleManagers = async (e, c, cb) => {
  const errRes = {
    m: 'avalibleManagers err',
    input: e
  }
  const res = {
    m: 'avalibleManagers'
  }
  const [err,
    ret] = await ListAvalibleManagers()
  if (err) {
    return ResFail(cb, {
      ...errRes,
      err: err
    }, err.code)
  }
  return ResOK(cb, {
    ...res,
    payload: ret
  })
}

const gameNew = async (e, c, cb) => {
  const errRes = {
    m: 'gameNew err',
    input: e
  }
  const res = {
    m: 'gameNew'
  }
  const [jsonParseErr,
    gameInfo] = JSONParser(e && e.body)
  if (jsonParseErr) {
    return ResFail(cb, {
      ...errRes,
      err: jsonParseErr
    }, jsonParseErr.code)
  }
  const [addGameInfoErr,
    addGameRet] = await AddGame(gameInfo)
  if (addGameInfoErr) {
    return ResFail(cb, {
      ...errRes,
      err: addGameInfoErr
    }, addGameInfoErr.code)
  }
  return ResOK(cb, {
    ...res,
    payload: addGameRet
  })
}

const gameList = async (e, c, cb) => {
  const errRes = {
    m: 'gamelist err',
    input: e
  }
  const res = {
    m: 'gamelist'
  }
  const [paramsErr,
    gameParams] = Model.pathParams(e)
  if (paramsErr) {
    return ResFail(cb, {
      ...errRes,
      err: paramsErr
    }, paramsErr.code)
  }
  const [err,
    ret] = await ListGames(gameParams)
  if (err) {
    return ResFail(cb, {
      ...errRes,
      err: err
    }, err.code)
  }
  return ResOK(cb, {
    ...res,
    payload: ret
  })
}

const billOne = async (e, c, cb) => {
  const [paramsErr,
    params] = Model.pathParams(e)
  if (paramsErr || !params.userId) {
    return ResErr(cb, paramsErr)
  }
  const [tokenErr,
    token] = await Model.currentToken(e)
  if (tokenErr) {
    return ResErr(cb, tokenErr)
  }
  const [queryErr,
    user] = await QueryUserById(params.userId)
  if (queryErr) {
    return ResErr(cb, queryErr)
  }
  const [balanceErr,
    balance] = await CheckBalance(token, user)
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
const billList = async (e, c, cb) => {
  // 查询出当前详情页面的所属用户的交易记录列表
  // 根据其长度 进行n次
  const [paramsErr,
    params] = Model.pathParams(e)
  if (paramsErr || !params.userId) {
    return ResErr(cb, paramsErr)
  }
  const [tokenErr,
    token] = await Model.currentToken(e)
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
const depositPoints = async (e, c, cb) => {
  const errRes = {
    m: 'depositPoints err',
    input: e
  }
  const res = {
    m: 'depositPoints'
  }
  const [jsonParseErr,
    depositInfo] = JSONParser(e && e.body)
  if (jsonParseErr) {
    return ResErr(cb, jsonParseErr)
  }
  const [tokenErr,
    token] = await Model.currentToken(e)
  if (tokenErr) {
    return ResErr(cb, tokenErr)
  }
  // 依据token判断当前登录用户是否是管理员
  // 如果是 再看传人的body参数是否满足条件2和3
  // 最后,如果当前登录用户不是管理员
  const [queryErr,
    fromUser] = await QueryBillUser(token, depositInfo.fromUserId)
  if (queryErr) {
    return ResFail(cb, queryErr)
  }
  // 获取fromUser的当前余额
  const [userBalanceErr,
    userBalance] = await CheckUserBalance(fromUser)
  if (userBalanceErr) {
    return ResErr(cb, userBalanceErr)
  }
  const [depositBillErr,
    depositBillRet] = await DepositTo(fromUser, {
      ...depositInfo,
      amount: Math.min(userBalance, depositInfo.amount)
    })
  if (depositBillErr) {
    return ResErr(cb, depositBillErr)
  }
  return ResOK(cb, {
    ...res,
    payload: depositBillRet
  })
}

const withdrawPoints = async (e, c, cb) => {
  const errRes = {
    m: 'withdrawPoints err',
    input: e
  }
  const res = {
    m: 'withdrawPoints'
  }
  const [jsonParseErr,
    withdrawInfo] = JSONParser(e && e.body)
  if (jsonParseErr) {
    return ResFail(cb, {
      ...errRes,
      err: jsonParseErr
    }, jsonParseErr.code)
  }
  const [tokenErr,
    token] = await Model.currentToken(e)
  if (tokenErr) {
    return ResFail(cb, {
      ...errRes,
      err: tokenErr
    }, tokenErr.code)
  }
  const [queryErr, fromUser] = await QueryBillUser(token, withdrawInfo.fromUserId)
  if (queryErr) {
    return ResErr(cb, queryErr)
  }
  const [userBalanceErr, userBalance] = await CheckUserBalance(fromUser)
  if (userBalanceErr) {
    return ResErr(cb, userBalanceErr)
  }
  const [withdrawBillErr,
    withdrawBillRet] = await WithdrawFrom(fromUser, {
      ...withdrawInfo,
      amount: Math.min(userBalance, withdrawInfo.amount)
    })
  if (withdrawBillErr) {
    return ResFail(cb, {
      ...errRes,
      err: withdrawBillErr
    }, withdrawBillErr.code)
  }
  return ResOK(cb, {
    ...res,
    payload: withdrawBillRet
  })
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
  // 参数校验
  // 业务操作
  const [err, ret] = await new MsnModel().scan()
  if (err) {
    return ResFail(cb, { ...errRes, err: err }, err.code)
  } else {
    return ResOK(cb, { ...res, payload: ret })
  }
}

const checkMsn = async (e, c, cb) => {
  const errRes = {
    m: 'checkMsn err',
    input: e
  }
  const res = {
    m: 'checkMsn'
  }
  const [paramErr,
    params] = Model.pathParams(e)
  if (paramErr) {
    return ResFail(cb, {
      ...errRes,
      err: paramErr
    }, paramErr.code)
  }
  const [checkErr,
    checkRet] = await CheckMSN(params)
  if (checkErr) {
    return ResFail(cb, {
      ...errRes,
      err: checkErr
    }, checkErr.code)
  }
  return ResOK(cb, {
    ...res,
    payload: {
      avalible: Boolean(checkRet)
    }
  })

}
const msnOne = async (e, c, cb) => { }

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
  // 参数校验
  if (!inparam.usage || !inparam.relKey) {
    return ResFail(cb, { ...errRes, err: BizErr.InparamError() }, BizErr.InparamErr().code)
  }
  // 业务操作
  inparam.code = randomNum(1000, 9999)
  const [err, ret] = await new CaptchaModel().putItem(inparam)
  if (err) {
    return ResFail(cb, { ...errRes, err: err }, err.code)
  } else {
    return ResOK(cb, { ...res, payload: inparam })
  }
}

/*
const exquery = async (e, c, cb) => {
  // 模拟入参
  const gameType = '3'
  const gameId = 'test'
  // 属性检查
  const array = [
    { name: "gameType", value: gameType, min: 2, max: 5, type: "S" },
    { name: "gameId", value: gameId, type: "N" }
  ]
  const [checkErr, checkRet] = Util.chekcProperties(array)
  if (checkErr) {
    console.error(checkRet)
  }
  // 业务操作
  else {
    const gameModel = new GameModel(gameType, gameId, new Date(), new Date())
    let [err, res] = await gameModel.save()
    console.info(res)
  }
}*/

// TOKEN验证
const jwtverify = async (e, c, cb) => {
  // get the token from event.authorizationToken
  const token = e.authorizationToken.split(' ')
  if (token[0] !== 'Bearer') {
    return c.fail('Unauthorized: wrong token type')
  }
  // verify it and return the policy statements
  const [err,
    userInfo] = await JwtVerify(token[1])
  if (err || !userInfo) {
    console.log(JSON.stringify(err), JSON.stringify(userInfo));
    return c.fail('Unauthorized')
  }

  return c.succeed(GeneratePolicyDocument(userInfo.userId, 'Allow', e.methodArn, userInfo))

}

// 随机四位数
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
  jwtverify, // 用于进行token验证的方法
  eva, // 用于创建系统的第一个管理员账号
  userAuth, // 用户登录
  adminNew,
  adminList,
  adminCenter,
  userNew, // 创建新用户
  userGrabToken, // 使用apiKey登录获取用户信息
  managerList, // 建站商列表
  managerOne,
  managerUpdate, // 编辑某个建站商
  merchantList, // 商户列表
  merchantOne, //商户
  merchantUpdate, // 编辑某个商户
  randomPassword,
  avalibleManagers, //当前可用的建站商
  gameNew, // 新建游戏
  gameList, // 游戏列表
  depositPoints, // 存点
  withdrawPoints, // 取点
  msnList, // 线路号列表
  checkMsn, // 检查msn是否被占用
  msnOne, //获取一个未被占用的线路号
  billList, // 流水列表
  billOne,
  captcha // 获取验证码
}

// export {
//   exquery
// }
