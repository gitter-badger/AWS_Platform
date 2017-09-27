import { ResOK, ResErr, Codes, JSONParser, Model, RoleCodeEnum, Trim, Pick, BizErr } from './lib/all'
import { LogModel } from './model/LogModel'
import { ConfigModel } from './model/ConfigModel'

import { ConfigCheck } from './biz/ConfigCheck'

/**
 * 创建排队配置
 */
const queueNew = async (e, c, cb) => {
  try {
    const [jsonParseErr, inparam] = JSONParser(e && e.body)
    //检查参数是否合法
    const [checkAttError, errorParams] = new ConfigCheck().checkQueue(inparam)
    // 获取令牌，只有管理员有权限
    const [tokenErr, token] = await Model.currentRoleToken(e, RoleCodeEnum['PlatformAdmin'])

    // 业务操作
    const [err, ret] = await new ConfigModel().add(inparam)

    // 操作日志记录
    inparam.operateAction = '排队设置'
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
    // 获取令牌，只有管理员有权限
    const [tokenErr, token] = await Model.currentRoleToken(e, RoleCodeEnum['PlatformAdmin'])

    // 业务操作
    const [err, ret] = await new ConfigModel().getOne(inparam)

    // 结果返回
    if (err) { return ResErr(cb, err) }
    return ResOK(cb, { payload: ret })
  } catch (error) {
    return ResErr(cb, error)
  }
}

// ==================== 以下为内部方法 ====================

export {
  queueNew,                    // 新建配置
  configOne                    // 单个配置
}