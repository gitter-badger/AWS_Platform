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
import { LogModel } from './model/LogModel'

import { CaptchaCheck } from './biz/CaptchaCheck'
import { MsnCheck } from './biz/MsnCheck'

const ResOK = (callback, res) => callback(null, Success(res))
const ResFail = (callback, res, code = Codes.Error) => callback(null, Fail(res, code))
const ResErr = (callback, err) => ResFail(callback, { err: err }, err.code)

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

  msnList,                      // 线路号列表
  checkMsn,                     // 检查msn是否被占用
  lockmsn,                      // 锁定/解锁msn
  msnRandom,                    // 随机线路号
  captcha                       // 获取验证码
}
