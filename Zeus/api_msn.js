import { ResOK, ResErr, Codes, JSONParser, Model, Pick, BizErr, MSNStatusEnum, RoleCodeEnum, } from './lib/all'
import { CaptchaModel } from './model/CaptchaModel'
import { MsnModel } from './model/MsnModel'
import { LogModel } from './model/LogModel'

import { CaptchaCheck } from './biz/CaptchaCheck'
import { MsnCheck } from './biz/MsnCheck'
const captchapng = require('captchapng')
/**
 * 获取线路号列表
 */
const msnList = async (e, c, cb) => {
  try {
    // 数据输入，转换，校验
    e = e || {}
    e.body = e.body || {}
    const [jsonParseErr, inparam] = JSONParser(e && e.body)
    // 获取令牌,只有管理员有权限
    const [tokenErr, token] = await Model.currentRoleToken(e, RoleCodeEnum['PlatformAdmin'])
    // 业务操作
    const [err, ret] = await new MsnModel().scan()
    if (err) {
      return ResErr(cb, err)
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
      return ResOK(cb, { payload: ret })
    }
  } catch (error) {
    return ResErr(cb, error)
  }

}
/**
 * 检查线路号是否可用
 */
const checkMsn = async (e, c, cb) => {
  try {
    // 入参校验
    const [paramErr, params] = Model.pathParams(e)
    if (paramErr) {
      return ResErr(cb, paramErr)
    }
    //检查参数是否合法
    const [checkAttError, errorParams] = new MsnCheck().check(params)
    // 获取身份令牌
    const [tokenErr, token] = await Model.currentToken(e)
    // 业务操作
    const [checkErr, checkRet] = await new MsnModel().checkMSN(params)
    // 结果返回
    if (checkErr) { return ResErr(cb, checkErr) }
    return ResOK(cb, { payload: { avalible: Boolean(checkRet) } })
  } catch (error) {
    return ResErr(cb, error)
  }
}
/**
 * 随机线路号
 */
const msnRandom = async (e, c, cb) => {
  try {
    // 数据输入，转换，校验
    // 获取身份令牌
    const [tokenErr, token] = await Model.currentToken(e)
    // 业务操作
    const [err, ret] = await new MsnModel().scan()
    if (err) {
      return ResErr(cb, err)
    } else {
      // 所有线路号都被占用
      if (ret.Items.length >= 999) {
        return ResErr(cb, BizErr.MsnFullError())
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
      return ResOK(cb, { payload: randomMsn })
    }
  } catch (error) {
    return ResErr(cb, error)
  }
}
/**
 * 锁定/解锁线路号
 */
const lockmsn = async (e, c, cb) => {
  try {
    // 入参校验
    const [paramErr, params] = Model.pathParams(e)
    if (paramErr) {
      return ResErr(cb, paramErr)
    }
    //检查参数是否合法
    const [checkAttError, errorParams] = new MsnCheck().checkMsnLock(params)
    // 获取令牌,只有管理员有权限
    const [tokenErr, token] = await Model.currentRoleToken(e, RoleCodeEnum['PlatformAdmin'])
    // 查询msn
    const [queryErr, queryRet] = await new MsnModel().queryMSN(params)
    // 锁定
    if (params.status == MSNStatusEnum.Locked) {
      if (queryRet.Items.length == 0) {
        const msn = { msn: params.msn, userId: '0', status: MSNStatusEnum.Locked }
        const [err, ret] = await new MsnModel().putItem(msn)

        // 操作日志记录
        params.operateAction = '锁定线路号'
        params.operateToken = token
        new LogModel().addOperate(params, err, ret)

        if (err) { return ResErr(cb, err) }
        return ResOK(cb, { payload: msn })
      }
      else {
        return ResErr(cb, BizErr.MsnUsedError())
      }
    }
    // 解锁
    else {
      if (queryRet.Items.length == 1 && queryRet.Items[0].status == 2) {
        const [err, ret] = await new MsnModel().deleteItem({ Key: { msn: params.msn, userId: '0' } })
        // 操作日志记录
        params.operateAction = '解锁线路号'
        params.operateToken = token
        new LogModel().addOperate(params, err, ret)
        // 结果返回
        if (err) { return ResErr(cb, err) }
        return ResOK(cb, { payload: params.msn })
      }
      else {
        return ResErr(cb, BizErr.MsnNotExistError())
      }
    }
  } catch (error) {
    return ResErr(cb, error)
  }
}

/**
 * 获取登录验证码，接口编号：
 */
const captcha = async (e, c, cb) => {
  try {
    // 入参转换
    const [jsonParseErr, inparam] = JSONParser(e && e.body)
    // 检查参数是否合法
    const [checkAttError, errorParams] = new CaptchaCheck().checkCaptcha(inparam)
    // 业务操作
    inparam.code = randomNum(1000, 9999)
    const [err, ret] = await new CaptchaModel().putItem(inparam)
    // 生成验证码的base64返回
    let p = new captchapng(80, 30, parseInt(inparam.code))
    p.color(255, 255, 255, 0) // First color: background (red, green, blue, alpha)
    p.color(80, 80, 80, 255)  // Second color: paint (red, green, blue, alpha)
    // 结果返回
    if (err) { return ResErr(cb, err) }
    return ResOK(cb, { payload: p.getBase64() })
  } catch (error) {
    return ResErr(cb, error)
  }
}

// ==================== 以下为内部方法 ====================

// 随机数
function randomNum(min, max) {
  let range = max - min
  let rand = Math.random()
  let num = min + Math.round(rand * range)
  return num
}

/**
  api export
**/
export {
  msnList,                      // 线路号列表
  checkMsn,                     // 检查msn是否被占用
  lockmsn,                      // 锁定/解锁msn
  msnRandom,                    // 随机线路号
  captcha                       // 获取验证码
}
