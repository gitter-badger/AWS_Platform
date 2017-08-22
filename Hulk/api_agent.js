import { ResOK, ResFail, ResErr, Codes, JSONParser, Model, Trim, Pick, BizErr, RoleCodeEnum, RoleEditProps } from './lib/all'
import { AgentModel } from './model/AgentModel'
import { UserModel } from './model/UserModel'
import { LogModel } from './model/LogModel'
import { BillModel } from './model/BillModel'

import { AgentCheck } from './biz/AgentCheck'

/**
 * 代理管理员注册
 */
const agentAdminNew = async (e, c, cb) => {
    const res = { m: 'agentAdminNew' }
    // 从POST 的body中获取提交数据
    const [jsonParseErr, userInfo] = JSONParser(e && e.body)
    if (jsonParseErr) {
        return ResErr(cb, jsonParseErr)
    }
    //检查参数是否合法
    let [checkAttError, errorParams] = new AgentCheck().checkAdmin(userInfo)
    if (checkAttError) {
        Object.assign(checkAttError, { params: errorParams })
        return ResErr(cb, checkAttError)
    }
    // 获取令牌，只有代理管理员有权限
    // const [tokenErr, token] = await Model.currentRoleToken(e, RoleCodeEnum['Agent'])
    // if (tokenErr) {
    //     return ResErr(cb, tokenErr)
    // }
    // 业务操作
    const token = userInfo  // TODO 该接口不需要TOKEN，默认设置
    const [registerUserErr, resgisterUserRet] = await new AgentModel().registerAdmin(token, Model.addSourceIP(e, userInfo))
    // 操作日志记录
    userInfo.operateAction = '创建代理管理员'
    userInfo.operateToken = token
    new LogModel().addOperate(Model.addSourceIP(e, userInfo), registerUserErr, resgisterUserRet)
    // 结果返回
    if (registerUserErr) {
        return ResFail(cb, { ...res, err: registerUserErr }, registerUserErr.code)
    }

    return ResOK(cb, { ...res, payload: resgisterUserRet })
}

/**
 * 代理注册
 */
const agentNew = async (e, c, cb) => {
    const res = { m: 'agentNew' }
    // 从POST 的body中获取提交数据
    const [jsonParseErr, userInfo] = JSONParser(e && e.body)
    if (jsonParseErr) {
        return ResErr(cb, jsonParseErr)
    }
    //检查参数是否合法
    let [checkAttError, errorParams] = new AgentCheck().check(userInfo)
    if (checkAttError) {
        Object.assign(checkAttError, { params: errorParams })
        return ResErr(cb, checkAttError)
    }
    // 获取令牌，只有代理有权限
    const [tokenErr, token] = await Model.currentRoleToken(e, RoleCodeEnum['Agent'])
    if (tokenErr) {
        return ResErr(cb, tokenErr)
    }
    // 业务操作
    const [registerUserErr, resgisterUserRet] = await new AgentModel().register(token, Model.addSourceIP(e, userInfo))
    // 操作日志记录
    userInfo.operateAction = '创建代理'
    userInfo.operateToken = token
    new LogModel().addOperate(Model.addSourceIP(e, userInfo), registerUserErr, resgisterUserRet)
    // 结果返回
    if (registerUserErr) {
        return ResFail(cb, { ...res, err: registerUserErr }, registerUserErr.code)
    }

    return ResOK(cb, { ...res, payload: resgisterUserRet })
}

/**
 * 代理登录
 */
const agentLogin = async (e, c, cb) => {
    const res = { m: 'agentLogin' }
    // 输入参数转换与校验
    const [jsonParseErr, userLoginInfo] = JSONParser(e && e.body)
    if (jsonParseErr) {
        return ResErr(cb, jsonParseErr)
    }
    //检查参数是否合法
    let [checkAttError, errorParams] = new AgentCheck().checkLogin(userLoginInfo)
    if (checkAttError) {
        Object.assign(checkAttError, { params: errorParams })
        return ResErr(cb, checkAttError)
    }
    // 用户登录
    const [loginUserErr, loginUserRet] = await new AgentModel().login(Model.addSourceIP(e, userLoginInfo))
    // 登录日志
    new LogModel().addLogin(Model.addSourceIP(e, userLoginInfo), loginUserErr, Model.addSourceIP(e, loginUserRet))
    // 结果返回
    if (loginUserErr) {
        return ResFail(cb, { ...res, err: loginUserErr }, loginUserErr.code)
    }
    return ResOK(cb, { ...res, payload: loginUserRet })
}

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
    let [checkAttError, errorParams] = new AgentCheck().checkUpdate(inparam)
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

/**
 * 可用代理
 */
const availableAgents = async (e, c, cb) => {
    const res = { m: 'avalibleAgents' }
    // 入参转换
    const [jsonParseErr, inparam] = JSONParser(e && e.body)
    if (jsonParseErr) {
        return ResFail(cb, { ...res, err: jsonParseErr }, jsonParseErr.code)
    }
    // 身份令牌校验
    const [tokenErr, token] = await Model.currentToken(e)
    if (tokenErr) {
        return ResFail(cb, { ...res, err: tokenErr }, tokenErr.code)
    }
    // 业务操作
    const [err, ret] = await new UserModel().listAvailableAgents(token, inparam)
    if (err) {
        return ResFail(cb, { ...res, err: err }, err.code)
    }
    return ResOK(cb, { ...res, payload: ret })
}

// ==================== 以下为内部方法 ====================

export {
    agentLogin,                // 代理登录
    agentAdminNew,             // 代理管理员注册
    agentNew,                  // 代理注册
    agentList,                 // 代理列表
    agentOne,                  // 代理
    agentUpdate,               // 代理更新
    availableAgents            // 可用代理列表
}
