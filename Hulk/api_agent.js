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
    RoleCodeEnum,
    RoleEditProps
} from './lib/all'
import { UserModel } from './model/UserModel'
import { LogModel } from './model/LogModel'
import { BillModel } from './model/BillModel'

import { UserCheck } from './biz/UserCheck'

const ResOK = (callback, res) => callback(null, Success(res))
const ResFail = (callback, res, code = Codes.Error) => callback(null, Fail(res, code))
const ResErr = (callback, err) => ResFail(callback, { err: err }, err.code)

/**
 * 单个代理
 */
const agentOne = async (e, c, cb) => {
    // 入参校验
    const res = { m: 'agentOne' }
    const [paramsErr, params] = Model.pathParams(e)
    if (paramsErr || !params.id) {
        return ResFail(cb, { ...res, err: paramsErr }, paramsErr.code)
    }
    const [tokenErr, token] = await Model.currentToken(e)
    if (tokenErr) {
        return ResFail(cb, { ...res, err: tokenErr }, tokenErr.code)
    }
    // 业务操作
    const [err, ret] = await new UserModel().getUser(params.id, RoleCodeEnum['Agent'])
    // 结果返回
    if (err) {
        return ResFail(cb, { ...res, err: err }, err.code)
    }
    return ResOK(cb, { ...res, payload: ret })
}

/**
 * 获取代理列表
 */
const agentList = async (e, c, cb) => {
    // 入参校验
    const res = { m: 'agentList' }
    const [tokenErr, token] = await Model.currentToken(e)
    if (tokenErr) {
        return ResFail(cb, { ...res, err: tokenErr }, tokenErr.code)
    }
    // 业务操作
    const [err, ret] = await new UserModel().listChildUsers(token, RoleCodeEnum.Agent)
    // 结果返回
    if (err) {
        return ResFail(cb, { ...res, err: err }, err.code)
    }
    // 查询每个用户余额
    for (let user of ret) {
        let [balanceErr, lastBill] = await new BillModel().checkUserLastBill(user)
        user.balance = lastBill.lastBalance
        user.lastBill = lastBill
    }
    return ResOK(cb, { ...res, payload: ret })
}

/**
 * 更新代理
 */
const agentUpdate = async (e, c, cb) => {
    // 入参校验
    const res = { m: 'agentUpdate' }
    const [paramsErr, params] = Model.pathParams(e)
    if (paramsErr || !params.id) {
        return ResFail(cb, { ...res, err: paramsErr }, paramsErr.code)
    }
    const [jsonParseErr, inparam] = JSONParser(e && e.body)
    if (jsonParseErr) {
        return ResFail(cb, { ...res, err: jsonParseErr }, jsonParseErr.code)
    }
    //检查参数是否合法
    let [checkAttError, errorParams] = new UserCheck().checkUserUpdate(inparam)
    if (checkAttError) {
        Object.assign(checkAttError, { params: errorParams })
        return ResErr(cb, checkAttError)
    }
    // 身份令牌校验
    const [tokenErr, token] = await Model.currentToken(e)
    if (tokenErr) {
        return ResFail(cb, { ...res, err: tokenErr }, tokenErr.code)
    }
    // 业务操作
    const [err, ret] = await new UserModel().getUser(params.id, RoleCodeEnum['Agent'])
    if (err) {
        return ResFail(cb, { ...res, err: err }, err.code)
    }
    // 获取更新属性和新密码HASH
    const Agent = {
        ...ret, ...Pick(inparam, RoleEditProps[RoleCodeEnum['Agent']])
    }
    Agent.passhash = Model.hashGen(Agent.password)
    // 业务操作
    const [updateErr, updateRet] = await new UserModel().userUpdate(Agent)
    // 操作日志记录
    params.operateAction = '更新代理信息'
    params.operateToken = token
    new LogModel().addOperate(params, updateErr, updateRet)
    // 结果返回
    if (updateErr) {
        return ResFail(cb, { ...res, err: updateErr }, updateErr.code)
    }
    return ResOK(cb, { ...res, payload: updateRet })
}

// ==================== 以下为内部方法 ====================

/**
  api export
**/
export {
    agentList,                 // 代理列表
    agentOne,                  // 代理
    agentUpdate                // 代理更新
}
