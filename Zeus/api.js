import {
  Stream$,
  Success,
  Fail,
  Codes,
  JSONParser,
  Model,
  Tables,
  BillTypeEnum,
  StatusEnum,
  GenderEnum,
  RoleCodeEnum,
  Trim,
  JwtVerify,
  GeneratePolicyDocument
} from './lib/all'
import {RegisterUser, LoginUser,UserGrabToken} from './biz/auth'
import {
  CheckRoleFromToken,
  ListChildUsers,
  ListAvalibleManagers,
  AddGame,
  ListGames,
  DepositTo,
  WithdrawFrom,
  CheckMSN,
  FormatMSN,
  ManagerById,
  MerchantById

} from './biz/dao'

const ResOK = (callback, res) => callback(null, Success(res))
const ResFail = (callback, res, code = Codes.Error) => callback(null, Fail(res, code))
// 用于生成第一个管理员
const eva = async(e,c,cb) =>{
  const errRes = {
    m:'eva error'
  }
  const res = {
    m: 'userNew'
  }
  const [jsonParseErr,userInfo] = JSONParser(e&&e.body)
  if (jsonParseErr) {
    return ResFail(cb, {
      ...errRes,
      err: jsonParseErr
    }, jsonParseErr.code)
  }
  // admin dont need check token
  const [registerUserErr,
    resgisterUserRet] = await RegisterUser(Model.addSourceIP(e, userInfo))
  if (registerUserErr) {
    return ResFail(cb, {
      ...errRes,
      err: registerUserErr
    }, registerUserErr.code)
  }

  return ResOK(cb, {
    ...res,
    payload: resgisterUserRet
  })
}
// 用户注册
const userNew = async(e, c, cb) => {
  const errRes = {
    m: 'userNew error',
    input: e
  }
  const res = {
    m: 'userNew'
  }
  // 从POST 的body中获取提交数据
  const [jsonParseErr,
    userInfo] = JSONParser(e && e.body)
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

  const [roleErr,
    _] = CheckRoleFromToken(token, userInfo)
  if (roleErr) {
    return ResFail(cb, {
      ...errRes,
      err: roleErr
    }, roleErr.code)
  }
  const [registerUserErr,
    resgisterUserRet] = await RegisterUser(Model.addSourceIP(e, userInfo))
  if (registerUserErr) {
    return ResFail(cb, {
      ...errRes,
      err: registerUserErr
    }, registerUserErr.code)
  }

  return ResOK(cb, {
    ...res,
    payload: resgisterUserRet
  })
}
// 用户登录
const userAuth = async(e, c, cb) => {
  const errRes = {
    m: 'userNew error',
    input: e
  }
  const res = {
    m: 'userAuth'
  }
  const [jsonParseErr,
    userLoginInfo] = JSONParser(e && e.body)
  if (jsonParseErr) {
    return ResFail(cb, {
      ...errRes,
      err: jsonParseErr
    }, jsonParseErr.code)
  }
  const [loginUserErr,
    loginUserRet] = await LoginUser(Model.addSourceIP(e, userLoginInfo))
  if (loginUserErr) {
    return ResFail(cb, {
      ...errRes,
      err: loginUserErr
    }, loginUserErr.code)
  }
  return ResOK(cb, {
    ...res,
    payload: loginUserRet
  })
}
const userGrabToken = async (e,c,cb)=>{
  const errRes = {
    m: 'managerList error',
    input: e
  }
  const res = {
    m: 'managerList'
  }
  // username suffix role and apiKey
  const [jsonParseErr,userInfo] = JSONParser(e && e.body)
  if (jsonParseErr) {
    return ResFail(cb,{...errRes,err:jsonParseErr},jsonParseErr.code)
  }

  const [tokenErr,userToken] = await UserGrabToken(Model.addSourceIP(e,userInfo))
  if (tokenErr) {
    return ResFail(cb,{...errRes,err:tokenErr},tokenErr.code)
  }
  return ResOK(cb,{
    ...res,
    payload:userToken
  })



}
// 建站商列表
const managerList = async(e, c, cb) => {
  const errRes = {
    m: 'managerList error',
    input: e
  }
  const res = {
    m: 'managerList'
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
    ret] = await ListChildUsers(token, RoleCodeEnum.Manager)
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
const managerOne = async (e,c,cb) =>{
  const errRes = {
    m: 'managerOne err',
    input: e
  }
  const res = {
    m: 'managerOne'
  }
  const [paramsErr,params] = Model.pathParams(e)
  if (paramsErr || !params.id) {
    return ResFail(cb,{...errRes,err:paramsErr},paramsErr.code)
  }
  const [tokenErr,token] = await Model.currentToken(e)
  if (tokenErr) {
    return ResFail(cb,{...errRes,err:tokenErr},tokenErr.code)
  }
  const [managerErr,manager] = await ManagerById(params.id)
  if (managerErr) {
    return ResFail(cb,{...errRes,err:managerErr},managerErr.code)
  }
  return ResOK(cb,{...res,payload:manager})
}
const managerUpdate = async(e, c, cb) => {
  const res = {
    m: 'managerUpdate',
    input: e
  }
  return cb(null, Success(res))
}
const merchantOne = async (e,c,cb)=>{
  const errRes = {
    m:'merchantOne err',
    input:e
  }
  const res = {
    m:'merchantOne'
  }
  const [paramsErr,params] = Model.pathParams(e)
  if (paramsErr || !params.id) {
    return ResFail(cb,{...errRes,err:paramsErr},paramsErr.code)
  }
  const [tokenErr,token] = await Model.currentToken(e)
  if (tokenErr) {
    return ResFail(cb,{...errRes,err:tokenErr},tokenErr.code)
  }
  const [merchantErr,merchant] = await MerchantById(params.id)
  if (merchantErr) {
    return ResFail(cb,{...errRes,err:merchantErr},merchantErr.code)
  }
  return ResOK(cb,{...res,payload:merchant})
}
const merchantList = async(e, c, cb) => {

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
const merchantUpdate = async(e, c, cb) => {}
const randomPassword = (e,c,cb)=>{
  const res = {
    m:'randomPassword'
  }
  const passwd = Model.genPassword()
  return ResOK(cb,{...res,payload:{
    generatedPassword: passwd
  }})
}
const avalibleManagers = async(e, c, cb) => {
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

const gameNew = async(e, c, cb) => {
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

const gameList = async(e, c, cb) => {
  const errRes = {
    m: 'gamelist err',
    input: e
  }
  const res = {
    m: 'gamelist'
  }
  const [paramsErr,gameParams] = Model.pathParams(e)
  if (paramsErr) {
      return ResFail(cb,{...errRes,err:paramsErr},paramsErr.code)
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

const billList = async(e, c, cb) => {
  const bills = [
    {
      balance: 6000.00, // 最新余额
      oldBalance: 5000.00, // 旧余额
      createdAt: 1499156312967, // 交易时间
      billType: BillTypeEnum.Withdraw, //
      from: 'from account', // 交易发起账户
      to: 'to account', // 交易对象账户
      fromRole: 'role code', // 发起账户的角色
      toRole: 'role code', // 对象账户的角色
      points: 1000.00 | -100.00, // 金额
      billDetail: '5000 + 1000 = 6000', // 交易详情
      operator: 'operator name' // 操作人
    }, {
      balance: 7000.00, // 最新余额
      oldBalance: 5000.00, // 旧余额
      createdAt: 1499156312967, // 交易时间
      billType: BillTypeEnum.Deposit, //
      from: 'from account', // 交易发起账户
      to: 'to account', // 交易对象账户
      fromRole: 'role code', // 发起账户的角色
      toRole: 'role code', // 对象账户的角色
      points: 1000.00 | -100.00, // 金额
      billDetail: '5000 + 1000 = 6000', // 交易详情
      operator: 'operator name' // 操作人
    }

  ]
  const res = {
    m: 'billList',
    payload: bills,
    input: e
  }
  return cb(null, Success(res))
}
const depositPoints = async(e, c, cb) => {
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
  const [depositBillErr,
    depositBillRet] = await DepositTo(token, depositInfo)
  if (depositBillErr) {
    return ResFail(cb, {
      ...errRes,
      err: depositBillErr
    }, depositBillErr.code)
  }
  return ResOK(cb, {
    ...res,
    payload: depositBillRet
  })
}

const withdrawPoints = async(e, c, cb) => {
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
  const [withdrawBillErr,
    withdrawBillRet] = await WithdrawFrom(token, withdrawInfo)
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

const jwtverify = async(e, c, cb) => {
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

const msnList = async(e, c, cb) => {}
const checkMsn = async(e, c, cb) => {
  const errRes = {
    m: 'checkMsn err',
    input: e
  }
  const res = {
    m: 'checkMsn'
  }
  const [paramErr,params] = Model.pathParams(e)
  if (paramErr) {
    return ResFail(cb,{...errRes,err:paramErr},paramErr.code)
  }
  const [checkErr,
    checkRet] = await CheckMSN(params)
  if (checkErr) {
    return ResFail(cb, {
      ...errRes,
      err: checkErr
    }, checkErr.code)
  }
  return ResOK(cb,{
    ...res,
    payload: {
      avalible: Boolean(checkRet)
    }
  })

}
const msnOne = async(e, c, cb) => {}
/**
  api export
**/
export {
  jwtverify, // 用于进行token验证的方法
  eva, // 用于创建系统的第一个管理员账号
  userAuth, // 用户登录
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
  billList // 流水列表
}
