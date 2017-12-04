import { ResOK, ResErr, Codes, JSONParser, Model, RoleCodeEnum, BizErr } from './lib/all'
import { LogModel } from './model/LogModel'
import { SubRoleModel } from './model/SubRoleModel'

import { SubRoleCheck } from './biz/SubRoleCheck'

/**
 * 创建子角色
 */
const subRoleNew = async (e, c, cb) => {
  try {
    const [jsonParseErr, subRoleInfo] = JSONParser(e && e.body)
    //检查参数是否合法
    const [checkAttError, errorParams] = new SubRoleCheck().checkSubRole(subRoleInfo)
    // 获取令牌，只有管理员有权限
    const [tokenErr, token] = await Model.currentRoleToken(e, RoleCodeEnum['PlatformAdmin'])
    // 业务操作
    const [err, ret] = await new SubRoleModel().addSubRole(subRoleInfo)
    // 操作日志记录
    subRoleInfo.operateAction = '创建子角色'
    subRoleInfo.operateToken = token
    new LogModel().addOperate(subRoleInfo, err, ret)
    // 结果返回
    if (err) { return ResErr(cb, err) }
    return ResOK(cb, { payload: ret })
  } catch (error) {
    return ResErr(cb, error)
  }
}

/**
 * 子角色列表
 */
const subRoleList = async (e, c, cb) => {
  try {
    const [jsonParseErr, inparam] = JSONParser(e && e.body)
    // 获取令牌，只有管理员有权限
    const [tokenErr, token] = await Model.currentRoleToken(e, RoleCodeEnum['PlatformAdmin'])

    // 业务操作  
    const [err, ret] = await new SubRoleModel().listSubRole(inparam)

    // 结果返回
    if (err) { return ResErr(cb, err) }
    return ResOK(cb, { payload: ret })
  } catch (error) {
    return ResErr(cb, error)
  }
}


/**
 * 变更子角色
 */
const subRoleUpdate = async (e, c, cb) => {
  try {
    // 入参转换
    const [jsonParseErr, inparam] = JSONParser(e && e.body)
    // 检查参数是否合法
    const [checkAttError, errorParams] = new SubRoleCheck().checkSubRole(inparam)
    // 获取令牌，只有管理员有权限
    const [tokenErr, token] = await Model.currentRoleToken(e, RoleCodeEnum['PlatformAdmin'])

    // 业务操作
    const [err, ret] = await new SubRoleModel().update(inparam)

    // 操作日志记录
    inparam.operateAction = '子角色更新'
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
 * 子角色删除
 */
const subRoleDelete = async (e, c, cb) => {
  try {
    // 入参转换
    const [jsonParseErr, inparam] = JSONParser(e && e.body)
    // 检查参数是否合法
    // const [checkAttError, errorParams] = new SubRoleCheck().checkSubRole(inparam)
    // 获取令牌，只有管理员有权限
    const [tokenErr, token] = await Model.currentRoleToken(e, RoleCodeEnum['PlatformAdmin'])

    // 业务操作
    const [err, ret] = await new SubRoleModel().delete(inparam)

    // 操作日志记录
    inparam.operateAction = '子角色删除'
    inparam.operateToken = token
    new LogModel().addOperate(inparam, err, ret)
    // 结果返回
    if (err) { return ResErr(cb, err) }
    return ResOK(cb, { payload: ret })
  } catch (error) {
    return ResErr(cb, error)
  }
}

// ==================== 以下为内部方法 ====================

export {
  subRoleNew,                   // 新建子角色
  subRoleList,                  // 子角色列表  
  subRoleUpdate,                // 子角色变更
  subRoleDelete                 // 子角色删除
}