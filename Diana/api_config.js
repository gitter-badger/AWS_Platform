import { ResOK, ResErr, Codes, JSONParser, Model, RoleCodeEnum, BizErr } from './lib/all'
import { LogModel } from './model/LogModel'
import { UserModel } from './model/UserModel'
import { ConfigModel } from './model/ConfigModel'
import { ConfigMultModel } from './model/ConfigMultModel'

import { ConfigCheck } from './biz/ConfigCheck'
import _ from 'lodash'

/**
 * 创建配置
 */
const configNew = async (e, c, cb) => {
  try {
    const [jsonParseErr, inparam] = JSONParser(e && e.body)
    //检查参数是否合法
    if (inparam.code == 'queue') {
      const [checkAttError, errorParams] = new ConfigCheck().checkQueue(inparam)
    } else if (inparam.code == 'bfagent') {
      const [checkAttError, errorParams] = new ConfigCheck().checkBFagent(inparam)
    } else if (inparam.code == 'mystery') {
      const [checkAttError, errorParams] = new ConfigCheck().checkMystery(inparam)
    } else {
      throw { 'code': -1, 'msg': '配置编码错误', 'params': ['code'] }
    }
    // 身份令牌
    const [tokenErr, token] = await Model.currentToken(e)

    // 业务操作
    const [err, ret] = await new ConfigModel().add(inparam)

    // 操作日志记录
    inparam.operateAction = '更新配置:' + inparam.code
    inparam.operateToken = token
    new LogModel().addOperate(inparam, err, ret)
    // 结果返回
    if (err) { return ResErr(cb, err) }
    return ResOK(cb, { payload: ret })
  } catch (error) {
    return ResErr(cb, error)
  }
}

/**
 * 单个配置
 */
const configOne = async (e, c, cb) => {
  try {
    // 入参转换
    const [jsonParseErr, inparam] = JSONParser(e && e.body)
    // 身份令牌
    const [tokenErr, token] = await Model.currentToken(e)

    // 业务操作
    const [err, ret] = await new ConfigModel().getOne(inparam)

    // 结果返回
    if (err) { return ResErr(cb, err) }
    return ResOK(cb, { payload: ret })
  } catch (error) {
    return ResErr(cb, error)
  }
}

/**
 * 创建多级配置
 */
const configMultNew = async (e, c, cb) => {
  try {
    const [jsonParseErr, inparam] = JSONParser(e && e.body)
    //检查参数是否合法
    if (inparam.code == 'videoconfig') {
      const [checkAttError, errorParams] = new ConfigCheck().checkVideoConfig(inparam)
    } else {
      throw { 'code': -1, 'msg': '配置编码错误', 'params': ['code'] }
    }
    // 身份令牌
    const [tokenErr, token] = await Model.currentToken(e)
    // 业务操作
    const [err, ret] = await new ConfigMultModel().add(inparam)
    // 操作日志记录
    inparam.operateAction = '更新多级配置:' + inparam.code
    inparam.operateToken = token
    new LogModel().addOperate(inparam, err, ret)
    // 结果返回
    if (err) { return ResErr(cb, err) }
    return ResOK(cb, { payload: ret })
  } catch (error) {
    return ResErr(cb, error)
  }
}
/**
 * 单个多级配置
 */
const configMultOne = async (e, c, cb) => {
  try {
    // 入参转换
    const [jsonParseErr, inparam] = JSONParser(e && e.body)
    // 身份令牌
    const [tokenErr, token] = await Model.currentToken(e)
    // 业务操作
    const [err, ret] = await new ConfigMultModel().getOne(inparam)
    // 结果返回
    if (err) { return ResErr(cb, err) }
    return ResOK(cb, { payload: ret })
  } catch (error) {
    return ResErr(cb, error)
  }
}

/**
 * 多级配置列表
 */
const configMultList = async (e, c, cb) => {
  try {
    // 入参转换
    const [jsonParseErr, inparam] = JSONParser(e && e.body)
    // 身份令牌
    const [tokenErr, token] = await Model.currentToken(e)
    // 业务操作
    let [err, ret] = await new ConfigMultModel().page(inparam)
    // 如果是电子游戏配置，需要所有商户
    if (inparam.code == 'videoconfig') {
      inparam.role = RoleCodeEnum.Merchant
      const [usersErr, usersRet] = await new UserModel().queryByRole(inparam)
      if (usersErr) { return ResErr(cb, usersErr) }
      for (let user of usersRet) {
        const itemIndex = _.findIndex(ret, ['businessKey', user.displayId.toString()])
        if (itemIndex >= 0) {
          user.content = ret[itemIndex]
        }
      }
      ret = usersRet
    }
    // 结果返回
    if (err) { return ResErr(cb, err) }
    return ResOK(cb, { payload: ret })
  } catch (error) {
    console.error(error)
    return ResErr(cb, error)
  }
}

// ==================== 以下为内部方法 ====================

export {
  configNew,                    // 新建配置
  configOne,                    // 单个配置
  configMultNew,                // 新建多级配置
  configMultOne,                // 单个多级配置
  configMultList                // 多级配置列表
}