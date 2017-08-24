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
    try {
        const res = { m: 'agentAdminNew' }
        // 入参数据
        const [jsonParseErr, userInfo] = JSONParser(e && e.body)
        //检查参数是否合法
        const [checkAttError, errorParams] = new AgentCheck().checkAdmin(userInfo)
        // 获取令牌，只有代理管理员有权限
        // const [tokenErr, token] = await Model.currentRoleToken(e, RoleCodeEnum['Agent'])
        // 业务操作
        const token = userInfo  // TODO 该接口不需要TOKEN，默认设置
        const [registerUserErr, resgisterUserRet] = await new AgentModel().registerAdmin(Model.addSourceIP(e, userInfo))
        // 操作日志记录
        userInfo.operateAction = '创建代理管理员'
        userInfo.operateToken = token
        new LogModel().addOperate(Model.addSourceIP(e, userInfo), registerUserErr, resgisterUserRet)
        // 结果返回
        if (registerUserErr) { return ResFail(cb, { ...res, err: registerUserErr }, registerUserErr.code) }
        return ResOK(cb, { ...res, payload: resgisterUserRet })
    } catch (error) {
        return ResErr(cb, error)
    }
}

/**
 * 代理注册
 */
const agentNew = async (e, c, cb) => {
    try {
        const res = { m: 'agentNew' }
        // 入参数据
        const [jsonParseErr, userInfo] = JSONParser(e && e.body)
        //检查参数是否合法
        const [checkAttError, errorParams] = new AgentCheck().check(userInfo)
        // 获取令牌，只有代理有权限
        const [tokenErr, token] = await Model.currentRoleToken(e, RoleCodeEnum['Agent'])
        // 业务操作
        const [registerUserErr, resgisterUserRet] = await new AgentModel().register(token, Model.addSourceIP(e, userInfo))
        // 操作日志记录
        userInfo.operateAction = '创建代理'
        userInfo.operateToken = token
        new LogModel().addOperate(Model.addSourceIP(e, userInfo), registerUserErr, resgisterUserRet)
        // 结果返回
        if (registerUserErr) { return ResFail(cb, { ...res, err: registerUserErr }, registerUserErr.code) }
        return ResOK(cb, { ...res, payload: resgisterUserRet })
    } catch (error) {
        return ResErr(cb, error)
    }
}

/**
 * 代理登录
 */
const agentLogin = async (e, c, cb) => {
    try {
        const res = { m: 'agentLogin' }
        // 输入参数转换与校验
        const [jsonParseErr, userLoginInfo] = JSONParser(e && e.body)
        //检查参数是否合法
        const [checkAttError, errorParams] = new AgentCheck().checkLogin(userLoginInfo)
        // 用户登录
        const [loginUserErr, loginUserRet] = await new AgentModel().login(Model.addSourceIP(e, userLoginInfo))
        // 登录日志
        new LogModel().addLogin(Model.addSourceIP(e, userLoginInfo), loginUserErr, Model.addSourceIP(e, loginUserRet))
        // 结果返回
        if (loginUserErr) { return ResFail(cb, { ...res, err: loginUserErr }, loginUserErr.code) }
        return ResOK(cb, { ...res, payload: loginUserRet })
    } catch (error) {
        return ResErr(cb, error)
    }
}

/**
 * 单个代理
 */
const agentOne = async (e, c, cb) => {
    try {
        // 入参校验
        const res = { m: 'agentOne' }
        const [paramsErr, params] = Model.pathParams(e)
        if (paramsErr || !params.id) {
            return ResFail(cb, { ...res, err: paramsErr }, paramsErr.code)
        }
        // 获取令牌，只有代理有权限
        const [tokenErr, token] = await Model.currentRoleToken(e, RoleCodeEnum['Agent'])
        // 业务操作
        const [err, ret] = await new UserModel().getUser(params.id, RoleCodeEnum['Agent'])
        // 结果返回
        if (err) { return ResFail(cb, { ...res, err: err }, err.code) }
        return ResOK(cb, { ...res, payload: ret })
    } catch (error) {
        return ResErr(cb, error)
    }
}

/**
 * 获取代理列表
 */
const agentList = async (e, c, cb) => {
    try {
        // 入参校验
        const res = { m: 'agentList' }
        const [paramsErr, inparam] = Model.pathParams(e)
        if (paramsErr) {
            return ResFail(cb, { ...res, err: paramsErr }, paramsErr.code)
        }
        // 获取令牌，只有代理有权限
        const [tokenErr, token] = await Model.currentRoleToken(e, RoleCodeEnum['Agent'])
        // 业务操作
        const [err, ret] = await new UserModel().listChildUsers(token, RoleCodeEnum.Agent, inparam)
        if (err) { return ResFail(cb, { ...res, err: err }, err.code) }
        // 查询每个用户余额
        for (let user of ret) {
            const [balanceErr, lastBill] = await new BillModel().checkUserLastBill(user)
            user.balance = lastBill.lastBalance
            user.lastBill = lastBill
        }
        // 结果返回
        return ResOK(cb, { ...res, payload: ret })
    } catch (error) {
        return ResErr(cb, error)
    }
}

/**
 * 更新代理
 */
const agentUpdate = async (e, c, cb) => {
    try {
        // 入参校验
        const res = { m: 'agentUpdate' }
        const [jsonParseErr, inparam] = JSONParser(e && e.body)
        //检查参数是否合法
        const [checkAttError, errorParams] = new AgentCheck().checkUpdate(inparam)
        // 获取令牌，只有代理有权限
        const [tokenErr, token] = await Model.currentRoleToken(e, RoleCodeEnum['Agent'])
        // 业务操作
        const [err, ret] = await new UserModel().getUser(inparam.userId, RoleCodeEnum['Agent'])
        if (err) { return ResFail(cb, { ...res, err: err }, err.code) }
        // 获取更新属性和新密码HASH
        const Agent = { ...ret, ...Pick(inparam, RoleEditProps[RoleCodeEnum['Agent']]) }
        Agent.passhash = Model.hashGen(Agent.password)
        // 业务操作
        const [updateErr, updateRet] = await new UserModel().userUpdate(Agent)
        // 操作日志记录
        inparam.operateAction = '更新代理信息'
        inparam.operateToken = token
        new LogModel().addOperate(inparam, updateErr, updateRet)
        // 结果返回
        if (updateErr) { return ResFail(cb, { ...res, err: updateErr }, updateErr.code) }
        return ResOK(cb, { ...res, payload: updateRet })
    } catch (error) {
        return ResErr(cb, error)
    }
}

/**
 * 可用代理
 */
const availableAgents = async (e, c, cb) => {
    try {
        const res = { m: 'avalibleAgents' }
        // 入参转换
        const [jsonParseErr, inparam] = JSONParser(e && e.body)
        // 获取令牌，只有代理有权限
        const [tokenErr, token] = await Model.currentRoleToken(e, RoleCodeEnum['Agent'])
        // 业务操作
        const [err, ret] = await new UserModel().listAvailableAgents(token, inparam)
        if (err) { return ResFail(cb, { ...res, err: err }, err.code) }
        return ResOK(cb, { ...res, payload: ret })
    } catch (error) {
        return ResErr(cb, error)
    }
}

/**
 * 管理员列表
 */
const agentAdminList = async (e, c, cb) => {
    try {
        // 只有代理管理员角色可操作
        const [tokenErr, token] = await Model.currentRoleToken(e, RoleCodeEnum['Agent'])
        if (!Model.isAgentAdmin(token)) {
            return ResErr(cb, BizErr.TokenErr('只有代理管理员有权限'))
        }
        // 业务操作
        const [err, admins] = await new UserModel().listAllAdmins(token)
        // 结果返回
        if (err) { return ResErr(cb, err) }
        return ResOK(cb, { payload: admins })
    } catch (error) {
        return ResErr(cb, error)
    }
}

// ==================== 以下为内部方法 ====================

export {
    agentLogin,                // 代理登录
    agentAdminNew,             // 代理管理员注册
    agentNew,                  // 代理注册
    agentList,                 // 代理列表
    agentOne,                  // 代理
    agentUpdate,               // 代理更新
    availableAgents,           // 可用代理列表
    agentAdminList             // 代理管理员列表
}
