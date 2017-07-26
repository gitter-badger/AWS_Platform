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
import { CaptchaModel } from './model/CaptchaModel'
import { MsnModel } from './model/MsnModel'
import { UserModel } from './model/UserModel'
import { LogModel } from './model/LogModel'

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
  const errRes = { m: 'userAuth error'/*, input: e*/ }
  const res = { m: 'userAuth' }
  // 输入参数转换与校验
  const [jsonParseErr, userLoginInfo] = JSONParser(e && e.body)
  if (jsonParseErr) {
    return ResErr(cb, jsonParseErr)
  }
  // 用户登录
  const [loginUserErr, loginUserRet] = await LoginUser(Model.addSourceIP(e, userLoginInfo))
  // 日志记录
  new LogModel().addLogin(Model.addSourceIP(e, userLoginInfo), loginUserErr, Model.addSourceIP(e, loginUserRet))

  if (loginUserErr) {
    return ResFail(cb, { ...errRes, err: loginUserErr }, loginUserErr.code)
  }
  return ResOK(cb, { ...res, payload: loginUserRet })
}

/**
 * 获取用户TOKEN
 */
const userGrabToken = async (e, c, cb) => {
  const errRes = { m: 'userGrabToken error', input: e }
  const res = { m: 'userGrabToken' }
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
  if (!inparam.role || !inparam.userId) {
    return ResFail(cb, { ...errRes, err: BizErr.InparamErr() }, BizErr.InparamErr().code)
  }
  // 身份令牌
  const [tokenErr, token] = await Model.currentToken(e)
  if (tokenErr) {
    return ResErr(cb, tokenErr)
  }
  // 只有管理员有权限
  if (token.role !== RoleCodeEnum['PlatformAdmin']) {
    return [BizErr.TokenErr('must admin token'), 0]
  }
  // 更新用户状态
  const [err, ret] = await new UserModel().changeStatus(inparam.role, inparam.userId, inparam.status)
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
  const errRes = { m: 'merchantList err', input: e }
  const res = { m: 'merchantList' }
  const [tokenErr, token] = await Model.currentToken(e)
  if (tokenErr) {
    return ResFail(cb, { ...errRes, err: tokenErr }, tokenErr.code)
  }
  const [err, ret] = await ListChildUsers(token, RoleCodeEnum.Merchant)
  if (err) {
    return ResFail(cb, { ...errRes, err: err }, err.code)
  }
  return ResOK(cb, { ...res, payload: ret })

}

/**
 * 更新商户
 */
const merchantUpdate = async (e, c, cb) => {
  const errRes = { m: 'merchantUpdate err', input: e }
  const res = { m: 'merchantUpdate' }
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
  const [jsonParseErr, merchantInfo] = JSONParser(e && e.body)
  if (jsonParseErr) {
    return ResFail(cb, { ...errRes, err: jsonParseErr }, jsonParseErr.code)
  }
  const Merchant = {
    ...merchant, ...Pick(merchantInfo, RoleEditProps[RoleCodeEnum['Manager']])
  }
  const [updateErr, updateRet] = await UserUpdate(Merchant)
  if (updateErr) {
    return ResFail(cb, { ...errRes, err: updateErr }, updateErr.code)
  }
  return ResOK(cb, { ...res, payload: updateRet })
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
  const errRes = { m: 'avalibleManagers err', input: e }
  const res = { m: 'avalibleManagers' }
  const [err, ret] = await ListAvalibleManagers()
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
  // 参数校验
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
    return ResOK(cb, { ...res, payload: ret })
  }
}
/**
 * 检查线路号是否可用
 */
const checkMsn = async (e, c, cb) => {
  const errRes = { m: 'checkMsn err', input: e }
  const res = { m: 'checkMsn' }
  const [paramErr, params] = Model.pathParams(e)
  if (paramErr) {
    return ResFail(cb, { ...errRes, err: paramErr }, paramErr.code)
  }
  const [checkErr, checkRet] = await CheckMSN(params)
  if (checkErr) {
    return ResFail(cb, { ...errRes, err: checkErr }, checkErr.code)
  }
  return ResOK(cb, {
    ...res,
    payload: {
      avalible: Boolean(checkRet)
    }
  })
}
/**
 * 随机线路号
 */
const msnRandom = async (e, c, cb) => {
  // 数据输入，转换，校验
  const errRes = { m: 'msnRandom error' }
  const res = { m: 'msnRandom' }
  // 参数校验
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
    return ResOK(cb, { ...res, payload: randomMsn })
  }
}
/**
 * 锁定/解锁线路号
 */
const lockmsn = async (e, c, cb) => {
  const errRes = { m: 'lockmsn err', input: e }
  const res = { m: 'lockmsn' }
  const [paramErr, params] = Model.pathParams(e)
  if (paramErr) {
    return ResFail(cb, { ...errRes, err: paramErr }, paramErr.code)
  }
  // 获取令牌
  const [tokenErr, token] = await Model.currentToken(e)
  if (tokenErr) {
    return ResErr(cb, tokenErr)
  }
  // 只有管理员有权限
  if (token.role !== RoleCodeEnum['PlatformAdmin']) {
    return [BizErr.TokenErr('must admin token'), 0]
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

// /**
//  * 创建游戏
//  */
// const gameNew = async (e, c, cb) => {
//   const errRes = { m: 'gameNew err', input: e }
//   const res = { m: 'gameNew' }
//   const [jsonParseErr, gameInfo] = JSONParser(e && e.body)
//   if (jsonParseErr) {
//     return ResFail(cb, { ...errRes, err: jsonParseErr }, jsonParseErr.code)
//   }
//   const [addGameInfoErr, addGameRet] = await AddGame(gameInfo)
//   if (addGameInfoErr) {
//     return ResFail(cb, { ...errRes, err: addGameInfoErr }, addGameInfoErr.code)
//   }
//   return ResOK(cb, { ...res, payload: addGameRet })
// }

// /**
//  * 游戏列表
//  */
// const gameList = async (e, c, cb) => {
//   const errRes = { m: 'gamelist err', input: e }
//   const res = { m: 'gamelist' }
//   const [paramsErr, gameParams] = Model.pathParams(e)
//   if (paramsErr) {
//     return ResFail(cb, { ...errRes, err: paramsErr }, paramsErr.code)
//   }
//   const [err, ret] = await ListGames(gameParams)
//   if (err) {
//     return ResFail(cb, { ...errRes, err: err }, err.code)
//   }
//   return ResOK(cb, { ...res, payload: ret })
// }

// /**
//  * 单个账单详情
//  */
// const billOne = async (e, c, cb) => {
//   const [paramsErr, params] = Model.pathParams(e)
//   if (paramsErr || !params.userId) {
//     return ResErr(cb, paramsErr)
//   }
//   const [tokenErr, token] = await Model.currentToken(e)
//   if (tokenErr) {
//     return ResErr(cb, tokenErr)
//   }
//   const [queryErr, user] = await QueryUserById(params.userId)
//   if (queryErr) {
//     return ResErr(cb, queryErr)
//   }
//   const [balanceErr, balance] = await CheckBalance(token, user)
//   if (balanceErr) {
//     return ResErr(cb, balanceErr)
//   }
//   return ResOK(cb, {
//     payload: {
//       balance: balance,
//       userId: params.userId
//     }
//   })
// }

// /**
//  * 账单列表
//  */
// const billList = async (e, c, cb) => {
//   // 查询出当前详情页面的所属用户的交易记录列表
//   // 根据其长度 进行n次
//   const [paramsErr, params] = Model.pathParams(e)
//   if (paramsErr || !params.userId) {
//     return ResErr(cb, paramsErr)
//   }
//   const [tokenErr, token] = await Model.currentToken(e)
//   if (tokenErr) {
//     return ResErr(cb, tokenErr)
//   }

//   const [queryErr, bills] = await ComputeWaterfall(token, params.userId)
//   if (queryErr) {
//     return ResErr(cb, queryErr)
//   }
//   return ResOK(cb, {
//     payload: bills
//   })
// }

// /*
//   提点
//   转点 操作
//   1 fromUser是toUser的parent (非管理员)
//   2.fromUser是管理员 因为管理员是所有用户的parent
//   3. 管理员指定fromUser 和 toUser 此时也需要满足约束 1
//   4. 当前的非管理员用户也可以代表自己的下级进行转点操作
// */

// /**
//  * 存点
//  */
// const depositPoints = async (e, c, cb) => {
//   const errRes = { m: 'depositPoints err', input: e }
//   const res = { m: 'depositPoints' }
//   const [jsonParseErr, depositInfo] = JSONParser(e && e.body)
//   if (jsonParseErr) {
//     return ResErr(cb, jsonParseErr)
//   }
//   const [tokenErr, token] = await Model.currentToken(e)
//   if (tokenErr) {
//     return ResErr(cb, tokenErr)
//   }
//   // 依据token判断当前登录用户是否是管理员
//   // 如果是 再看传人的body参数是否满足条件2和3
//   // 最后,如果当前登录用户不是管理员
//   const [queryErr, fromUser] = await QueryBillUser(token, depositInfo.fromUserId)
//   if (queryErr) {
//     return ResFail(cb, queryErr)
//   }
//   // 获取fromUser的当前余额
//   const [userBalanceErr, userBalance] = await CheckUserBalance(fromUser)
//   if (userBalanceErr) {
//     return ResErr(cb, userBalanceErr)
//   }
//   const [depositBillErr, depositBillRet] = await DepositTo(fromUser, {
//     ...depositInfo,
//     amount: Math.min(userBalance, depositInfo.amount)
//   })
//   if (depositBillErr) {
//     return ResErr(cb, depositBillErr)
//   }
//   return ResOK(cb, { ...res, payload: depositBillRet })
// }
// /**
//  * 提点
//  */
// const withdrawPoints = async (e, c, cb) => {
//   const errRes = { m: 'withdrawPoints err', input: e }
//   const res = { m: 'withdrawPoints' }
//   const [jsonParseErr, withdrawInfo] = JSONParser(e && e.body)
//   if (jsonParseErr) {
//     return ResFail(cb, { ...errRes, err: jsonParseErr }, jsonParseErr.code)
//   }
//   const [tokenErr, token] = await Model.currentToken(e)
//   if (tokenErr) {
//     return ResFail(cb, { ...errRes, err: tokenErr }, tokenErr.code)
//   }
//   const [queryErr, fromUser] = await QueryBillUser(token, withdrawInfo.fromUserId)
//   if (queryErr) {
//     return ResErr(cb, queryErr)
//   }
//   const [userBalanceErr, userBalance] = await CheckUserBalance(fromUser)
//   if (userBalanceErr) {
//     return ResErr(cb, userBalanceErr)
//   }
//   const [withdrawBillErr, withdrawBillRet] = await WithdrawFrom(fromUser, {
//     ...withdrawInfo,
//     amount: Math.min(userBalance, withdrawInfo.amount)
//   })
//   if (withdrawBillErr) {
//     return ResFail(cb, { ...errRes, err: withdrawBillErr }, withdrawBillErr.code)
//   }
//   return ResOK(cb, { ...res, payload: withdrawBillRet })
// }

// ==================== 以下为内部方法 ====================

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

  randomPassword                // 随机密码

}

// export {
  // gameNew,                      // 新建游戏
  // gameList,                     // 游戏列表
  // billList,                     // 流水列表
  // billOne,                       
  // depositPoints,                // 存点
  // withdrawPoints,               // 取点
//   exquery
// }
