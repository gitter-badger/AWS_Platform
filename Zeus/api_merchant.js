import { ResOK, ResErr, Codes, JSONParser, Model, Pick, BizErr, RoleCodeEnum, RoleEditProps } from './lib/all'
import { UserModel } from './model/UserModel'
import { MerchantModel } from './model/MerchantModel'
import { LogModel } from './model/LogModel'
import { BillModel } from './model/BillModel'

import { UserCheck } from './biz/UserCheck'

/**
 * 获取商户列表
 */
const merchantList = async (e, c, cb) => {
  try {
    // 入参转换
    const [jsonParseErr, inparam] = JSONParser(e && e.body)
    // 身份令牌
    const [tokenErr, token] = await Model.currentToken(e)
    // 列表页搜索和排序查询
    const [err, ret] = await new MerchantModel().page(token, inparam)
    if (err) { return ResErr(cb, err) }
    // 查询每个用户余额
    for (let user of ret) {
      const [balanceErr, lastBill] = await new BillModel().checkUserLastBill(user)
      user.balance = lastBill.lastBalance
      user.lastBill = lastBill
    }
    // 结果返回
    if (err) { return ResErr(cb, err) }
    return ResOK(cb, { payload: ret })
  } catch (error) {
    return ResErr(cb, error)
  }
}

/**
 * 获取商户信息
 */
const merchantOne = async (e, c, cb) => {
  try {
    // 入参校验
    const [paramsErr, params] = Model.pathParams(e)
    if (paramsErr || !params.id) {
      return ResErr(cb, paramsErr)
    }
    // 身份令牌
    const [tokenErr, token] = await Model.currentToken(e)
    // 业务操作
    const [merchantErr, merchant] = await new UserModel().getUser(params.id, RoleCodeEnum['Merchant'])
    // 结果返回
    if (merchantErr) { return ResErr(cb, merchantErr) }
    return ResOK(cb, { payload: merchant })
  } catch (error) {
    return ResErr(cb, error)
  }
}

/**
 * 更新商户
 */
const merchantUpdate = async (e, c, cb) => {
  try {
    // 入参校验
    const [paramsErr, params] = Model.pathParams(e)
    if (paramsErr || !params.id) {
      return ResErr(cb, paramsErr)
    }
    const [jsonParseErr, merchantInfo] = JSONParser(e && e.body)
    //检查参数是否合法
    const [checkAttError, errorParams] = new UserCheck().checkUserUpdate(merchantInfo)
    // 身份令牌校验
    const [tokenErr, token] = await Model.currentToken(e)
    // 业务操作
    const [merchantErr, merchant] = await new UserModel().getUser(params.id, RoleCodeEnum['Merchant'])
    if (merchantErr) {
      return ResErr(cb, merchantErr)
    }
    // 获取更新属性和新密码HASH
    const Merchant = {
      ...merchant, ...Pick(merchantInfo, RoleEditProps[RoleCodeEnum['Merchant']])
    }
    Merchant.passhash = Model.hashGen(Merchant.password)
    // 业务操作
    const [updateErr, updateRet] = await new UserModel().userUpdate(Merchant)
    // 操作日志记录
    params.operateAction = '更新商户信息'
    params.operateToken = token
    new LogModel().addOperate(params, updateErr, updateRet)
    // 结果返回
    if (updateErr) { return ResErr(cb, updateErr) }
    return ResOK(cb, { payload: updateRet })
  } catch (error) {
    return ResErr(cb, error)
  }
}

// ==================== 以下为内部方法 ====================

/**
  api export
**/
export {
  merchantList,                 // 商户列表
  merchantOne,                  // 商户
  merchantUpdate                // 编辑某个商户
}
