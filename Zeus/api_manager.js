import { ResOK, ResErr, Codes, JSONParser, Model, Pick, BizErr, RoleCodeEnum, RoleEditProps } from './lib/all'
import { UserModel } from './model/UserModel'
import { ManagerModel } from './model/ManagerModel'
import { LogModel } from './model/LogModel'
import { BillModel } from './model/BillModel'

import { UserCheck } from './biz/UserCheck'
import _ from 'lodash'
/**
 * 线路商列表
 */
const managerList = async (e, c, cb) => {
  try {
    // 入参转换
    const [jsonParseErr, inparam] = JSONParser(e && e.body)
    // 身份令牌
    const [tokenErr, token] = await Model.currentToken(e)
    // 只有管理员/线路商有权限
    if (!Model.isPlatformAdmin(token) && !Model.isManager(token)) {
      return ResErr(cb, BizErr.TokenErr('只有管理员/线路商有权限'))
    }
    // 列表页搜索和排序查询
    const [err, ret] = await new ManagerModel().page(token, inparam)
    // 结果返回
    if (err) { return ResErr(cb, err) }
    // 查询每个用户余额 
    for (let user of ret) {
      const [balanceErr, lastBill] = await new BillModel().checkUserLastBill(user)
      user.balance = lastBill.lastBalance
      user.lastBill = lastBill
      // 查询已用商户已用数量
      const [err, ret] = await new UserModel().listChildUsers(user, RoleCodeEnum['Merchant'])
      if (ret && ret.length > 0) {
        user.merchantUsedCount = ret.length
      } else {
        user.merchantUsedCount = 0
      }
    }
    return ResOK(cb, { payload: ret })
  } catch (error) {
    return ResErr(cb, error)
  }
}
/**
 * 获取建站商信息
 */
const managerOne = async (e, c, cb) => {
  try {
    // 入参校验
    const [paramsErr, params] = Model.pathParams(e)
    if (paramsErr || !params.id) {
      return ResErr(cb, paramsErr)
    }
    // 身份令牌
    const [tokenErr, token] = await Model.currentToken(e)
    // 只有管理员/线路商有权限
    if (!Model.isPlatformAdmin(token) && !Model.isManager(token)) {
      return ResErr(cb, BizErr.TokenErr('只有管理员/线路商有权限'))
    }
    // 业务操作
    const [managerErr, manager] = await new UserModel().getUser(params.id, RoleCodeEnum['Manager'])

    // 查询已用商户已用数量
    const [err, ret] = await new UserModel().listChildUsers(manager, RoleCodeEnum['Merchant'])
    if (ret && ret.length > 0) {
      manager.merchantUsedCount = ret.length
    } else {
      manager.merchantUsedCount = 0
    }

    // 结果返回
    if (managerErr) { return ResErr(cb, managerErr) }
    return ResOK(cb, { payload: manager })
  } catch (error) {
    return ResErr(cb, error)
  }
}
/**
 * 更新线路商信息
 */
const managerUpdate = async (e, c, cb) => {
  try {
    // 入参校验
    const [paramsErr, params] = Model.pathParams(e)
    if (paramsErr || !params.id) {
      return ResErr(cb, paramsErr)
    }
    // 入参转化
    const [jsonParseErr, managerInfo] = JSONParser(e && e.body)
    //检查参数是否合法
    const [checkAttError, errorParams] = new UserCheck().checkUserUpdate(managerInfo)
    // 获取令牌
    const [tokenErr, token] = await Model.currentToken(e)
    // 只有管理员/线路商有权限
    if (!Model.isPlatformAdmin(token) && !Model.isManager(token)) {
      return ResErr(cb, BizErr.TokenErr('只有管理员/线路商有权限'))
    }
    // 业务操作
    const [managerErr, manager] = await new UserModel().getUser(params.id, RoleCodeEnum['Manager'])
    if (managerErr) {
      return ResErr(cb, managerErr)
    }
    // 获取更新属性和新密码HASH
    const Manager = { ...manager, ...Pick(managerInfo, RoleEditProps[RoleCodeEnum['Manager']]) }
    Manager.passhash = Model.hashGen(Manager.password)
    // 业务操作
    const [updateErr, updateRet] = await new UserModel().userUpdate(Manager)
    if (updateErr) { return ResErr(cb, updateErr) }

    // 判断是否变更了游戏或者抽成比
    let gameListDifference = getGameListDifference(manager, managerInfo)
    let isChangeGameList = gameListDifference.length > 0 ? false : true
    let isChangeRate = manager.rate == managerInfo.rate ? false : true
    // 判断是否更新所有子用户的游戏或者抽成比
    relatedChange(isChangeGameList, isChangeRate, gameListDifference, Manager)
    
    // 操作日志记录
    params.operateAction = '更新线路商信息'
    params.operateToken = token
    new LogModel().addOperate(params, updateErr, updateRet)
    // 结果返回
    return ResOK(cb, { payload: updateRet })
  } catch (error) {
    return ResErr(cb, error)
  }
}

/**
 * 可用线路商
 */
const avalibleManagers = async (e, c, cb) => {
  try {
    // 获取令牌
    const [tokenErr, token] = await Model.currentToken(e)
    // 只有管理员/线路商有权限
    if (!Model.isPlatformAdmin(token) && !Model.isManager(token)) {
      return ResErr(cb, BizErr.TokenErr('只有管理员/线路商有权限'))
    }
    // 业务操作
    const [err, ret] = await new UserModel().listAvalibleManagers()
    // 结果返回
    if (err) { return ResErr(cb, err) }
    return ResOK(cb, { payload: ret })
  } catch (error) {
    return ResErr(cb, error)
  }
}

// ==================== 以下为内部方法 ====================
/**
 * 获取减少的游戏数组
 * @param {*} userBefore 
 * @param {*} userAfter 
 */
function getGameListDifference(userBefore, userAfter) {
  let gameListBefore = []
  let gameListAfter = []
  for (let i of userBefore.gameList) {
    gameListBefore.push(i.code)
  }
  for (let j of userAfter.gameList) {
    gameListAfter.push(j.code)
  }
  return _.difference(gameListBefore, gameListAfter)
}
/**
 * 变更子用户的游戏和抽成比等
 * @param {*} isChangeGameList 
 * @param {*} isChangeRate 
 * @param {*} gameListDifference 
 * @param {*} user 
 */
async function relatedChange(isChangeGameList, isChangeRate, gameListDifference, user) {
  if (isChangeGameList || isChangeRate) {
    const [allChildErr, allChildRet] = await new UserModel().listAllChildUsers(user)
    for (let child of allChildRet) {
      let isNeedUpdate = false
      // 如果变更了抽成比，且小于子用户抽成比，同步子用户抽成比
      if (isChangeRate && user.rate < child.rate) {
        child.rate = user.rate
        isNeedUpdate = true
      }
      // 如果减少游戏，则同步子用户游戏
      if (isChangeGameList) {
        let subGameList = []
        for (let item of child.gameList) {
          if (_.indexOf(gameListDifference, item.code) == -1) {
            subGameList.push(item)
          }
        }
        child.gameList = subGameList
        isNeedUpdate = true
      }
      // 如果需要，则同步更新子用户
      if (isNeedUpdate) {
        await new UserModel().userUpdate(child)
      }
    }
  }
}
/**
  api export
**/
export {
  managerList,                  // 建站商列表
  managerOne,                   // 建站商详情
  managerUpdate,                // 编辑某个建站商
  avalibleManagers             // 当前可用的建站商
}
