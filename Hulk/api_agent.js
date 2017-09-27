import { ResOK, ResErr, Codes, JSONParser, Model, Trim, Pick, BizErr, RoleCodeEnum, RoleEditProps } from './lib/all'
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
        // 入参数据
        const [jsonParseErr, userInfo] = JSONParser(e && e.body)
        //检查参数是否合法
        const [checkAttError, errorParams] = new AgentCheck().checkAdmin(userInfo)
        // 获取令牌
        const [tokenErr, token] = await Model.currentRoleToken(e, RoleCodeEnum['Agent'])
        // 只能代理管理员操作
        if (!Model.isAgentAdmin(token)) {
            return ResErr(cb, BizErr.TokenErr('只能代理管理员操作'))
        }
        const [registerUserErr, resgisterUserRet] = await new AgentModel().registerAdmin(Model.addSourceIP(e, userInfo))
        // 操作日志记录
        userInfo.operateAction = '创建代理管理员'
        userInfo.operateToken = token
        new LogModel().addOperate(Model.addSourceIP(e, userInfo), registerUserErr, resgisterUserRet)
        // 结果返回
        if (registerUserErr) { return ResErr(cb, registerUserErr) }
        return ResOK(cb, { payload: resgisterUserRet })
    } catch (error) {
        return ResErr(cb, error)
    }
}

/**
 * 代理注册
 */
const agentNew = async (e, c, cb) => {
    try {
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
        if (registerUserErr) { return ResErr(cb, registerUserErr) }
        return ResOK(cb, { payload: resgisterUserRet })
    } catch (error) {
        return ResErr(cb, error)
    }
}

/**
 * 代理登录
 */
const agentLogin = async (e, c, cb) => {
    try {
        // 输入参数转换与校验
        const [jsonParseErr, userLoginInfo] = JSONParser(e && e.body)
        //检查参数是否合法
        const [checkAttError, errorParams] = new AgentCheck().checkLogin(userLoginInfo)
        // 用户登录
        const [loginUserErr, loginUserRet] = await new AgentModel().login(Model.addSourceIP(e, userLoginInfo))
        // 登录日志
        new LogModel().addLogin(Model.addSourceIP(e, userLoginInfo), loginUserErr, Model.addSourceIP(e, loginUserRet))
        // 结果返回
        if (loginUserErr) { return ResErr(cb, loginUserErr) }
        return ResOK(cb, { payload: loginUserRet })
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
        const [paramsErr, params] = Model.pathParams(e)
        if (paramsErr || !params.id) {
            return ResErr(cb, paramsErr)
        }
        // 获取令牌，只有代理有权限
        const [tokenErr, token] = await Model.currentRoleToken(e, RoleCodeEnum['Agent'])
        // 业务操作
        const [err, ret] = await new UserModel().getUser(params.id, RoleCodeEnum['Agent'])
        const [balanceErr, lastBill] = await new BillModel().checkUserLastBill(ret)
        ret.balance = lastBill.lastBalance
        ret.lastBill = lastBill
        // 结果返回
        if (err) { return ResErr(cb, err) }
        return ResOK(cb, { payload: ret })
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
        const [paramsErr, inparam] = Model.pathParams(e)
        if (paramsErr) { return ResErr(cb, paramsErr) }
        // 获取令牌，只有代理有权限
        const [tokenErr, token] = await Model.currentRoleToken(e, RoleCodeEnum['Agent'])
        //检查参数是否合法
        inparam.token = token
        const [checkAttError, errorParams] = new AgentCheck().checkQueryList(inparam)
        // 业务操作
        const [err, ret] = await new UserModel().listChildUsers(token, RoleCodeEnum.Agent, inparam)
        if (err) { return ResErr(cb, err) }
        // 查询每个用户余额
        for (let user of ret) {
            const [balanceErr, lastBill] = await new BillModel().checkUserLastBill(user)
            user.balance = lastBill.lastBalance
            user.lastBill = lastBill
        }
        // 结果返回
        return ResOK(cb, { payload: ret })
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
        const [jsonParseErr, inparam] = JSONParser(e && e.body)
        //检查参数是否合法
        const [checkAttError, errorParams] = new AgentCheck().checkUpdate(inparam)
        // 获取令牌，只有代理有权限
        const [tokenErr, token] = await Model.currentRoleToken(e, RoleCodeEnum['Agent'])
        // 业务操作
        const [err, ret] = await new UserModel().getUser(inparam.userId, RoleCodeEnum['Agent'])
        if (err) { return ResErr(cb, err) }
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
        if (updateErr) { return ResErr(cb, updateErr) }
        return ResOK(cb, { payload: updateRet })
    } catch (error) {
        return ResErr(cb, error)
    }
}

/**
 * 可用代理
 */
const availableAgents = async (e, c, cb) => {
    try {
        // 入参转换
        const [jsonParseErr, inparam] = JSONParser(e && e.body)
        // 获取令牌，只有代理有权限
        const [tokenErr, token] = await Model.currentRoleToken(e, RoleCodeEnum['Agent'])
        // 业务操作
        const [err, ret] = await new UserModel().listAvailableAgents(token, inparam)
        if (err) { return ResErr(cb, err) }
        return ResOK(cb, { payload: ret })
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
        // 查询每个用户余额
        for (let user of admins) {
            const [balanceErr, lastBill] = await new BillModel().checkUserLastBill(user)
            user.balance = lastBill.lastBalance
            user.lastBill = lastBill
        }
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
