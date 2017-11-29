import { ResOK, ResErr, Codes, JSONParser, Model, BizErr, RoleCodeEnum, RoleEditProps } from './lib/all'
import { AgentModel } from './model/AgentModel'
import { UserModel } from './model/UserModel'
import { LogModel } from './model/LogModel'
import { BillModel } from './model/BillModel'

import { AgentCheck } from './biz/AgentCheck'
import _ from 'lodash'
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
        // 入参数据
        const [jsonParseErr, inparam] = JSONParser(e && e.body)
        // 获取令牌，只有代理有权限
        const [tokenErr, token] = await Model.currentRoleToken(e, RoleCodeEnum['Agent'])
        //检查参数是否合法
        inparam.token = token
        const [checkAttError, errorParams] = new AgentCheck().checkQueryList(inparam)
        // 业务操作
        let [err, ret] = await new AgentModel().page(token, inparam)
        if (err) { return ResErr(cb, err) }
        // 查询每个用户余额
        for (let user of ret) {
            const [balanceErr, lastBill] = await new BillModel().checkUserLastBill(user)
            user.balance = lastBill.lastBalance
            user.lastBill = lastBill
        }
        // 是否需要按照余额排序
        if (inparam.sortkey && inparam.sortkey == 'balance') {
            ret = _.sortBy(ret, [inparam.sortkey])
            if (inparam.sort == "desc") { ret = ret.reverse() }
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
        if (updateErr) { return ResErr(cb, updateErr) }

        // 判断是否变更了游戏或者抽成比
        let gameListDifference = getGameListDifference(ret, inparam)
        let isChangeGameList = gameListDifference.length == 0 ? false : true
        let isChangeRate = ret.rate == inparam.rate ? false : true
        let isChangeLiveMix = ret.liveMix == inparam.liveMix ? false : true
        let isChangeVedioMix = ret.vedioMix == inparam.vedioMix ? false : true
        // 判断是否更新所有子用户的游戏或者抽成比
        relatedChange(isChangeGameList, isChangeRate, isChangeLiveMix, isChangeVedioMix, gameListDifference, Agent)

        // 操作日志记录
        inparam.operateAction = '更新代理信息'
        inparam.operateToken = token
        new LogModel().addOperate(inparam, updateErr, updateRet)
        // 结果返回
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
        // 入参转换
        const [jsonParseErr, inparam] = JSONParser(e && e.body)
        // 只有代理管理员角色可操作
        const [tokenErr, token] = await Model.currentRoleToken(e, RoleCodeEnum['Agent'])
        if (!Model.isAgentAdmin(token)) {
            return ResErr(cb, BizErr.TokenErr('只有代理管理员有权限'))
        }
        // 业务操作
        let [err, admins] = await new AgentModel().adminPage(token, inparam)
        if (err) { return ResErr(cb, err) }
        // 查询每个用户余额
        for (let user of admins) {
            const [balanceErr, lastBill] = await new BillModel().checkUserLastBill(user)
            user.balance = lastBill.lastBalance
            user.lastBill = lastBill
        }
        // 是否需要按照余额排序
        if (inparam.sortkey && inparam.sortkey == 'balance') {
            admins = _.sortBy(admins, [inparam.sortkey])
            if (inparam.sort == "desc") { admins = admins.reverse() }
        }
        // 结果返回
        return ResOK(cb, { payload: admins })
    } catch (error) {
        return ResErr(cb, error)
    }
}

/**
 * 更新代理密码
 */
const updateAgentPassword = async (e, c, cb) => {
    try {
        // 入参转换和校验
        const [jsonParseErr, inparam] = JSONParser(e && e.body)
        // 检查参数是否合法
        const [checkAttError, errorParams] = new AgentCheck().checkPassword(inparam)
        // 身份令牌
        const [tokenErr, token] = await Model.currentToken(e)
        // 只有代理管理员/自己有权限
        if (!Model.isAgentAdmin(token) && !Model.isSelf(token, inparam)) {
            return ResErr(cb, BizErr.TokenErr('只有代理管理员/自己可以操作'))
        }
        // 查询用户
        const [queryErr, user] = await new UserModel().queryUserById(inparam.userId)
        if (queryErr) { return ResErr(cb, queryErr) }
        // 更新用户密码
        user.password = inparam.password
        user.passhash = Model.hashGen(user.password)
        const [err, ret] = await new UserModel().userUpdate(user)
        // 操作日志记录
        inparam.operateAction = '修改密码'
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
 * @param {*} isChangeLiveMix 
 * @param {*} isChangeVedioMix 
 * @param {*} gameListDifference 
 * @param {*} user 
 */
async function relatedChange(isChangeGameList, isChangeRate, isChangeLiveMix, isChangeVedioMix, gameListDifference, user) {
    if (isChangeGameList || isChangeRate || isChangeLiveMix || isChangeVedioMix) {
        const [allChildErr, allChildRet] = await new UserModel().listAllChildUsers(user)
        for (let child of allChildRet) {
            let isNeedUpdate = false
            // 如果变更了抽成比，且小于子用户抽成比，同步子用户抽成比
            if (isChangeRate && user.rate < child.rate) {
                child.rate = user.rate
                isNeedUpdate = true
            }
            // 如果变更了真人洗码比，且小于子用户真人洗码比，同步子用户真人洗码比
            if (isChangeLiveMix && user.liveMix < child.liveMix) {
                child.liveMix = user.liveMix
                isNeedUpdate = true
            }
            // 如果变更了电子游戏洗码比，且小于子用户电子游戏洗码比，同步子用户电子游戏洗码比
            if (isChangeVedioMix && user.vedioMix < child.vedioMix) {
                child.vedioMix = user.vedioMix
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

export {
    agentLogin,                // 代理登录
    agentAdminNew,             // 代理管理员注册
    agentNew,                  // 代理注册
    agentList,                 // 代理列表
    agentOne,                  // 代理
    agentUpdate,               // 代理更新
    availableAgents,           // 可用代理列表
    agentAdminList,            // 代理管理员列表
    updateAgentPassword        // 更新代理密码
}
