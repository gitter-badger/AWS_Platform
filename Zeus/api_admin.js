import { ResOK, ResErr, JSONParser, BizErr, RoleCodeEnum, SubRoleNameEnum, StatusEnum, Model, Codes, Pick } from './lib/all'
import { RegisterAdmin, UpdateAdmin, RegisterUser, LoginUser } from './biz/auth'
import { UserModel } from './model/UserModel'
import { AdminModel } from './model/AdminModel'
import { LogModel } from './model/LogModel'
import { BillModel } from './model/BillModel'

import { UserCheck } from './biz/UserCheck'
import _ from 'lodash'
/**
 * 创建管理员帐号
 */
const adminNew = async (e, c, cb) => {
    try {
        // 入参转换
        const [jsonParseErr, userInfo] = JSONParser(e && e.body)
        //检查参数是否合法
        const [checkAttError, errorParams] = new UserCheck().checkAdmin(userInfo)
        // 要求管理员角色
        const [tokenErr, token] = await Model.currentRoleToken(e, RoleCodeEnum['PlatformAdmin'])
        // 业务操作
        const [registAdminErr, adminUser] = await RegisterAdmin(Model.addSourceIP(e, userInfo))
        // 操作日志记录
        userInfo.operateAction = '创建管理员帐号'
        userInfo.operateToken = token
        new LogModel().addOperate(Model.addSourceIP(e, userInfo), registAdminErr, adminUser)
        // 结果返回
        if (registAdminErr) { return ResErr(cb, registAdminErr) }
        return ResOK(cb, { payload: adminUser })
    } catch (error) {
        return ResErr(cb, error)
    }
}
/**
 * 更新管理员帐号
 */
const adminUpdate = async (e, c, cb) => {
    try {
        // 入参转换
        const [jsonParseErr, userInfo] = JSONParser(e && e.body)
        //检查参数是否合法
        // const [checkAttError, errorParams] = new UserCheck().checkAdmin(userInfo)
        // 要求管理员角色
        const [tokenErr, token] = await Model.currentRoleToken(e, RoleCodeEnum['PlatformAdmin'])
        // 业务操作
        const [registAdminErr, adminUser] = await UpdateAdmin(Model.addSourceIP(e, userInfo))
        // 操作日志记录
        userInfo.operateAction = '更新管理员帐号'
        userInfo.operateToken = token
        new LogModel().addOperate(Model.addSourceIP(e, userInfo), registAdminErr, adminUser)
        // 结果返回
        if (registAdminErr) { return ResErr(cb, registAdminErr) }
        return ResOK(cb, { payload: adminUser })
    } catch (error) {
        return ResErr(cb, error)
    }
}
/**
 * 用户注册
 */
const userNew = async (e, c, cb) => {
    try {
        // 从POST 的body中获取提交数据
        const [jsonParseErr, userInfo] = JSONParser(e && e.body)
        // 检查参数是否合法
        const [checkAttError, errorParams] = new UserCheck().checkUser(userInfo)
        // 要求管理员角色
        const [tokenErr, token] = await Model.currentRoleToken(e, RoleCodeEnum['PlatformAdmin'])
        // 业务操作
        const [registerUserErr, resgisterUserRet] = await RegisterUser(token, Model.addSourceIP(e, userInfo))
        // 操作日志记录
        userInfo.operateAction = '创建用户'
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
 * 用户登录
 */
const userAuth = async (e, c, cb) => {
    try {
        // 入参转换
        const [jsonParseErr, userLoginInfo] = JSONParser(e && e.body)
        // 检查参数是否合法
        const [checkAttError, errorParams] = new UserCheck().checkLogin(userLoginInfo)
        // 用户登录
        const [loginUserErr, loginUserRet] = await LoginUser(Model.addSourceIP(e, userLoginInfo))
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
 * 变更用户状态
 */
const userChangeStatus = async (e, c, cb) => {
    try {
        // 入参转换和校验
        const [jsonParseErr, inparam] = JSONParser(e && e.body)
        //检查参数是否合法
        const [checkAttError, errorParams] = new UserCheck().checkStatus(inparam)
        // 查询用户
        const [userErr, user] = await new UserModel().queryUserById(inparam.userId)
        if (userErr) { return ResErr(cb, [userErr, 0]) }
        // 获取身份令牌
        const [tokenErr, token] = await Model.currentToken(e)
        // 平台用户只能平台管理员/父辈操作
        if (!Model.isAgent(user) && !Model.isPlatformAdmin(token) && !Model.isSubChild(token, user)) {
            return ResErr(cb, BizErr.TokenErr('平台用户只能平台管理员/上级操作'))
        }
        // 代理用户只能代理管理员/父辈操作
        if (Model.isAgent(user) && !Model.isAgentAdmin(token) && !Model.isSubChild(token, user)) {
            return ResErr(cb, BizErr.TokenErr('代理用户只能代理管理员/上级操作'))
        }
        // 更新用户
        user.status = inparam.status
        // 解锁需要更新有效期
        if (inparam.status == StatusEnum.Enable) {
            if (inparam.contractPeriod == 0 || !inparam.contractPeriod) {
                user.contractPeriod = 0
                user.isforever = true
            } else if (inparam.contractPeriod) {
                user.contractPeriod = inparam.contractPeriod
                user.isforever = false
            }
        }
        const [err, ret] = await new UserModel().userUpdate(user)
        // 操作日志记录
        inparam.operateAction = '变更用户状态'
        inparam.operateToken = token
        new LogModel().addOperate(inparam, err, ret)

        // 更新所有子用户状态
        const [allChildErr, allChildRet] = await new UserModel().listAllChildUsers(user)
        for (let child of allChildRet) {
            child.status = inparam.status
            new UserModel().userUpdate(child)
        }
        // 结果返回
        if (err) { ResErr(cb, err) }
        return ResOK(cb, { payload: ret })
    } catch (error) {
        return ResErr(cb, error)
    }
}

/**
 * 检查用户是否被占用
 */
const checkUserExist = async (e, c, cb) => {
    try {
        // 入参转换和校验
        const [jsonParseErr, inparam] = JSONParser(e && e.body)
        inparam.suffix = inparam.suffix || Model.StringValue
        if (!inparam.role || !inparam.suffix || !inparam.username) {
            return ResErr(cb, BizErr.InparamErr())
        }
        // 获取身份令牌
        const [tokenErr, token] = await Model.currentToken(e)
        //创建用户账号的只能是平台管理员或代理
        if (!Model.isAgent(inparam) && !Model.isPlatformAdmin(token)) {
            return ResErr(cb, BizErr.TokenErr('只有平台管理员有权限'))
        }
        if (Model.isAgent(token) && !Model.isAgent(token)) {
            return ResErr(cb, BizErr.TokenErr('只有代理有权限'))
        }
        // 业务操作
        const [err, ret] = await new UserModel().checkUserBySuffix(inparam.role, inparam.suffix, inparam.username)
        // 结果返回
        if (err) { return ResErr(cb, err) }
        return ResOK(cb, { payload: ret })

    } catch (error) {
        return ResErr(cb, error)
    }
}

/**
 * 检查前缀是否被占用
 */
const checkSuffixExist = async (e, c, cb) => {
    try {
        // 入参转换和校验
        const [jsonParseErr, inparam] = JSONParser(e && e.body)
        if (!inparam.role || !inparam.suffix) {
            return ResErr(cb, BizErr.InparamErr())
        }
        // 获取身份令牌
        const [tokenErr, token] = await Model.currentToken(e)
        //创建用户账号的只能是平台管理员或代理
        if (!Model.isAgent(inparam) && !Model.isPlatformAdmin(token)) {
            return ResErr(cb, BizErr.TokenErr('只有平台管理员有权限'))
        }
        if (Model.isAgent(token) && !Model.isAgent(token)) {
            return ResErr(cb, BizErr.TokenErr('只有代理有权限'))
        }
        // 业务操作
        const [err, ret] = await new UserModel().checkUserBySuffix(inparam.role, inparam.suffix, null)
        // 结果返回
        if (err) { ResErr(cb, err) }
        return ResOK(cb, { payload: ret })
    } catch (error) {
        return ResErr(cb, error)
    }
}

/**
 * 检查昵称是否被占用
 */
const checkNickExist = async (e, c, cb) => {
    try {
        // 入参转换和校验
        const [jsonParseErr, inparam] = JSONParser(e && e.body)
        if (!inparam.role || !inparam.displayName) {
            return ResErr(cb, BizErr.InparamErr())
        }
        // 获取身份令牌
        const [tokenErr, token] = await Model.currentToken(e)
        //创建用户账号的只能是平台管理员或代理
        if (!Model.isAgent(inparam) && !Model.isPlatformAdmin(token)) {
            return ResErr(cb, BizErr.TokenErr('只有平台管理员有权限'))
        }
        if (Model.isAgent(token) && !Model.isAgent(token)) {
            return ResErr(cb, BizErr.TokenErr('只有代理有权限'))
        }
        // 业务操作
        const [err, ret] = await new UserModel().checkNickExist(inparam.role, inparam.displayName)
        // 结果返回
        if (err) { return ResErr(cb, err) }
        return ResOK(cb, { payload: ret })
    } catch (error) {
        return ResErr(cb, error)
    }
}

/**
 * 管理员列表
 */
const adminList = async (e, c, cb) => {
    try {
        // 入参转换
        const [jsonParseErr, inparam] = JSONParser(e && e.body)
        // 只有管理员角色可操作
        const [tokenErr, token] = await Model.currentRoleToken(e, RoleCodeEnum['PlatformAdmin'])
        // 业务操作
        const [err, admins] = await new AdminModel().page(token, inparam)
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
 * 管理员个人中心
 */
const adminCenter = async (e, c, cb) => {
    try {
        // 只有管理员角色可操作
        const [tokenErr, token] = await Model.currentRoleToken(e, RoleCodeEnum['PlatformAdmin'])
        // 业务操作
        const [err, admin] = await new UserModel().getUser(token.userId, token.role)
        // 结果返回
        if (err) { return ResErr(cb, err) }
        return ResOK(cb, { payload: admin })
    } catch (error) {
        return ResErr(cb, error)
    }
}

/**
 * 获取下级用户列表
 */
const childList = async (e, c, cb) => {
    try {
        // 入参校验
        const [paramsErr, params] = Model.pathParams(e)
        if (paramsErr) {
            return ResErr(cb, paramsErr)
        }
        if (paramsErr || !params.childRole || !params.userId) {
            return ResErr(cb, BizErr.InparamErr())
        }
        // 身份令牌
        const [tokenErr, token] = await Model.currentToken(e)
        // 只能查看自己下级
        if (parseInt(token.role) > parseInt(params.childRole)) {
            return ResErr(cb, BizErr.InparamErr('只能查看下级用户'))
        }
        // 业务操作
        const [err, ret] = await new UserModel().listChildUsers(params, params.childRole)
        // 结果返回
        if (err) { return ResErr(cb, err) }
        // 查询每个用户余额
        for (let user of ret) {
            const [balanceErr, lastBill] = await new BillModel().checkUserLastBill(user)
            user.balance = lastBill.lastBalance
            user.lastBill = lastBill
        }
        return ResOK(cb, { payload: ret })
    } catch (error) {
        return ResErr(cb, error)
    }
}

/**
 * 更新密码
 */
const updatePassword = async (e, c, cb) => {
    try {
        // 入参转换和校验
        const [jsonParseErr, inparam] = JSONParser(e && e.body)
        // 检查参数是否合法
        const [checkAttError, errorParams] = new UserCheck().checkPassword(inparam)
        // 身份令牌
        const [tokenErr, token] = await Model.currentToken(e)
        // 只有管理员/自己有权限
        if (!Model.isPlatformAdmin(token) && !Model.isSelf(token, inparam)) {
            return ResErr(cb, BizErr.TokenErr('只有管理员/自己可以操作'))
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

export {
    userAuth,                     // 用户登录
    adminNew,                     // 新管理员
    adminUpdate,                  // 更新管理员
    adminList,                    // 管理员列表
    adminCenter,                  // 管理员个人中心
    userNew,                      // 创建新用户
    userChangeStatus,             // 变更用户状态
    childList,                    // 下级用户列表

    checkUserExist,               // 检查用户是否被占用
    checkSuffixExist,             // 检查前缀是否被占用
    checkNickExist,               // 检查昵称是否被占用

    updatePassword                // 更新密码
}
