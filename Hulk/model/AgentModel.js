import { Tables, Store$, Codes, BizErr, Trim, Empty, Model, Keys, Pick, Omit, StatusEnum, RoleCodeEnum, RoleDisplay, RoleModels } from '../lib/all'
import _ from 'lodash'
import { CaptchaModel } from '../model/CaptchaModel'
import { BaseModel } from './BaseModel'
import { UserModel } from '../model/UserModel'
import { BillModel } from '../model/BillModel'

export class AgentModel extends BaseModel {
    constructor() {
        super()
        // 设置表名
        this.params = {
            TableName: Tables.ZeusPlatformUser,
        }
        // 设置对象属性
        this.item = {
            ...this.baseitem,
            role: Model.StringValue,
            userId: Model.StringValue
        }
    }

    /**
     * 注册代理管理员
     * @param {*} userInfo 输入用户信息
     */
    async registerAdmin(userInfo) {
        // 默认值设置
        const adminRole = RoleModels[RoleCodeEnum['Agent']]()
        const CheckUser = { ...adminRole, ...userInfo, passhash: Model.hashGen(userInfo.password) }
        // 查询用户是否已存在
        const [queryUserErr, queryUserRet] = await new UserModel().checkUserBySuffix(CheckUser.role, CheckUser.suffix, CheckUser.username)
        if (queryUserErr) {
            return [queryUserErr, 0]
        }
        if (!queryUserRet) {
            return [BizErr.UserExistErr(), 0]
        }
        // 保存用户，处理用户名前缀
        const User = { ...CheckUser, uname: `${CheckUser.username}`, username: `${CheckUser.username}` }
        const [saveUserErr, saveUserRet] = await saveUser(User)
        if (saveUserErr) {
            return [saveUserErr, 0]
        }
        return [0, saveUserRet]
    }

    /**
     * 专门用于创建代理
     * @param {*} token 身份令牌
     * @param {*} userInfo 输入用户信息
     */
    async register(token = {}, userInfo = {}) {
        // 获取代理角色模型
        const bizRole = RoleModels[userInfo.role]()
        // 生成注册用户信息
        userInfo = Omit(userInfo, ['userId', 'passhash'])
        const userInput = Pick({ ...bizRole, ...userInfo }, Keys(bizRole))
        const CheckUser = { ...userInput, passhash: Model.hashGen(userInput.password) }

        // 检查用户是否已经存在
        const [queryUserErr, queryUserRet] = await new UserModel().checkUserBySuffix(CheckUser.role, CheckUser.suffix, CheckUser.username)
        if (queryUserErr) {
            return [queryUserErr, 0]
        }
        if (!queryUserRet) {
            return [BizErr.UserExistErr(), 0]
        }
        // 检查昵称是否已经存在
        const [queryNickErr, queryNickRet] = await new UserModel().checkNickExist(CheckUser.role, CheckUser.displayName)
        if (queryNickErr) {
            return [queryNickErr, 0]
        }
        if (!queryNickRet) {
            return [BizErr.NickExistErr(), 0]
        }
        // 如果parent未指定,则为管理员. 从当前管理员对点数中扣去点数进行充值. 点数不可以为负数.而且一定是管理员存点到新用户
        const [queryParentErr, parentUser] = await queryParent(token, CheckUser.parent)
        if (queryParentErr) {
            return [queryParentErr, 0]
        }
        // 检查下级洗码比
        if (parentUser.level != 0 && (userInfo.vedioMix > parentUser.vedioMix || userInfo.liveMix > parentUser.liveMix)) {
            return [BizErr.InparamErr('洗码比不能高于上级'), 0]
        }
        // 检查下级成数
        if (parentUser.level != 0 && (userInfo.rate > parentUser.rate)) {
            return [BizErr.InparamErr('成数比不能高于上级'), 0]
        }
        // 初始点数
        const initPoints = CheckUser.points
        // 检查余额
        const [queryBalanceErr, balance] = await new BillModel().checkUserBalance(token, parentUser)
        if (queryBalanceErr) {
            return [queryBalanceErr, 0]
        }
        if (initPoints > balance) {
            return [BizErr.BalanceErr(), 0]
        }

        // 层级处理
        let levelIndex = Model.DefaultParent
        if (parentUser.levelIndex && parentUser.levelIndex != '0' && parentUser.levelIndex != 0) {
            levelIndex = parentUser.levelIndex + ',' + parentUser.userId
        }

        // 保存用户，处理用户名前缀
        const User = {
            ...CheckUser,
            uname: `${CheckUser.username}`,
            username: `${CheckUser.username}`,
            parentName: parentUser.username,
            parentRole: parentUser.role,
            parentDisplayName: parentUser.displayName,
            parentSuffix: parentUser.suffix,
            points: Model.NumberValue,
            level: parentUser.level + 1,
            levelIndex: levelIndex
        }
        const [saveUserErr, saveUserRet] = await saveUser(User)
        if (saveUserErr) {
            return [saveUserErr, 0]
        }

        // 开始转账
        parentUser.operatorToken = token
        const [depositErr, depositRet] = await new BillModel().billTransfer(parentUser, {
            toUser: saveUserRet.username,
            toRole: saveUserRet.role,
            toLevel: saveUserRet.level,
            toDisplayName: saveUserRet.displayName,
            amount: initPoints,
            operator: token.username,
            remark: '初始点数'
        })
        var orderId = depositRet.sn
        if (depositErr) {
            orderId = '-1'
        }
        return [0, { ...saveUserRet, orderId: orderId }]
    }

    /**
     * 代理登录
     * @param {*} userLoginInfo 用户登录信息
     */
    async login(userLoginInfo = {}) {
        // 检查验证码
        const [checkErr, checkRet] = await new CaptchaModel().checkCaptcha(userLoginInfo)
        if (checkErr) {
            return [checkErr, 0]
        }
        // 获取代理角色模型
        const Role = RoleModels[userLoginInfo.role]()
        // 组装用户登录信息
        const UserLoginInfo = Pick({
            ...Role,
            ...userLoginInfo
        }, Keys(Role))
        const username = UserLoginInfo.username
        // 查询用户信息
        const [queryUserErr, User] = await new UserModel().getUserByName(userLoginInfo.role, username)
        if (queryUserErr) {
            return [queryUserErr, 0]
        }
        // 校验用户密码
        const valid = await Model.hashValidate(UserLoginInfo.password, User.passhash)
        if (!valid) {
            return [BizErr.PasswordErr(), User]
        }
        // 检查非管理员的有效期
        const [periodErr, periodRet] = await new UserModel().checkContractPeriod(User)
        if (periodErr) {
            return [periodErr, User]
        }
        // 检查用户是否被锁定
        if (User.status == StatusEnum.Disable) {
            return [BizErr.UserLockedErr(), User]
        }
        // 更新用户信息
        User.lastIP = UserLoginInfo.lastIP
        let [saveUserErr, saveUserRet] = await Store$('put', { TableName: Tables.ZeusPlatformUser, Item: User })
        if (saveUserErr) {
            return [saveUserErr, 0]
        }
        // const [saveUserErr, saveUserRet] = await saveUser(User)
        if (saveUserErr) {
            return [saveUserErr, User]
        }
        // 返回用户身份令牌
        saveUserRet = Pick(User, RoleDisplay[User.role])
        // 更新TOKEN
        await Store$('put', { TableName: Tables.SYSToken, Item: { iat: Math.floor(Date.now() / 1000) - 30, ...saveUserRet } })
        return [0, { ...saveUserRet, token: Model.token(saveUserRet) }]
    }
}

// 查询用户上级
const queryParent = async (token, parent) => {
    var id = 0
    if (!parent || Model.DefaultParent == parent) {
        id = token.userId
    } else {
        id = parent
    }
    const [err, user] = await new UserModel().queryUserById(id)
    if (err) {
        return [err, 0]
    }
    return [0, user]
}

// 保存用户
const saveUser = async (userInfo) => {
    // 从编码池获取新编码
    let [uucodeErr, uucodeRet] = [0, 0]
    if (RoleCodeEnum['Agent'] == userInfo.role) {
        [uucodeErr, uucodeRet] = await Model.uucode('displayId', 6)
        if (uucodeErr) {
            return [uucodeErr, 0]
        }
        userInfo.displayId = parseInt(uucodeRet)
    }

    // 组装用户信息
    const baseModel = Model.baseModel()
    const roleDisplay = RoleDisplay[userInfo.role]
    const UserItem = {
        ...baseModel,
        ...userInfo,
        updatedAt: Model.timeStamp(),
        loginAt: Model.timeStamp()
    }
    var saveConfig = { TableName: Tables.ZeusPlatformUser, Item: UserItem }
    // 保存用户
    const [saveUserErr, Ret] = await Store$('put', saveConfig)
    if (saveUserErr) {
        return [saveUserErr, 0]
    }
    // End:记录生成的编码
    if (uucodeRet) {
        Store$('put', { TableName: Tables.ZeusPlatformCode, Item: { type: 'displayId', code: uucodeRet } })
    }

    const ret = Pick(UserItem, roleDisplay)
    return [0, ret]
}