import {
  Store$,
  Tables,
  Codes,
  BizErr,
  Model,
  Trim,
  Empty,
  Pick,
  Keys,
  Omit,
  GenderEnum,
  StatusEnum,
  RoleCodeEnum,
  RoleModels,
  RoleDisplay,
  MSNStatusEnum
} from '../lib/all'
import { CheckMSN, CheckBalance, DepositTo } from './dao'
import { CaptchaModel } from '../model/CaptchaModel'
import { UserModel } from '../model/UserModel'

/**
 * 接口编号：0
 * 现在注册分成两部分 1. 管理员注册 2. 商户/建站商注册
 * @param {*} token 身份令牌
 * @param {*} userInfo 输入用户信息
 */
export const RegisterAdmin = async (token = {}, userInfo = {}) => {
  // 创建管理员账号的只能是管理员
  if (token.role !== RoleCodeEnum['PlatformAdmin']) {
    return [BizErr.TokenErr('must admin token'), 0]
  }
  // 默认值设置
  const adminRole = RoleModels[RoleCodeEnum['PlatformAdmin']]()
  const userInput = Pick({
    ...adminRole,
    ...Omit(userInfo, ['userId', 'points', 'role', 'suffix', 'passhash']) // 这几个都是默认值
  }, Keys(adminRole))
  // 检查用户数据
  const [userParamErr, _] = userParamCheck(userInput)
  if (userParamErr) {
    return [userParamErr, 0]
  }
  const CheckUser = { ...userInput, passhash: Model.hashGen(userInput.password) }
  // 查询用户是否已存在
  const [queryUserErr, queryUserRet] = await checkUserBySuffix(CheckUser.role, CheckUser.suffix, CheckUser.username)
  if (queryUserErr) {
    return [queryUserErr, 0]
  }
  if (queryUserRet.Items.length) {
    return [BizErr.UserExistErr(), 0]
  }
  // 保存用户
  const User = { ...CheckUser, username: `${CheckUser.suffix}_${CheckUser.username}` }
  const [saveUserErr, saveUserRet] = await saveUser(User)
  if (saveUserErr) {
    return [saveUserErr, 0]
  }
  return [0, saveUserRet]
}

/**
 * 接口编号：2
 * 专门用于创建商户/建站商
 * @param {*} token 身份令牌
 * @param {*} userInfo 输入用户信息
 */
export const RegisterUser = async (token = {}, userInfo = {}) => {
  //创建管理员账号的只能是管理员
  if (token.role !== RoleCodeEnum['PlatformAdmin']) {
    return [BizErr.TokenErr('must admin token'), 0]
  }
  if (userInfo.points < 0) {
    return [BizErr.ParamErr('points cant less then 0 for new user'), 0]
  }
  // 检查角色码
  const roleCode = userInfo.role
  if (roleCode === RoleCodeEnum['PlatformAdmin']) {
    return [BizErr.ParamErr('admin role cant create by this api'), 0]
  }
  // 根据角色码查询角色
  const [roleNotFoundErr, bizRole] = await getRole(roleCode)
  if (roleNotFoundErr) {
    return [roleNotFoundErr, 0]
  }
  // 生成注册用户信息
  userInfo = Omit(userInfo, ['userId', 'passhash'])
  const userInput = Pick({ ...bizRole, ...userInfo }, Keys(bizRole))
  const [userParamErr, _] = userParamCheck(userInput)
  if (userParamErr) {
    return [userParamErr, 0]
  }
  const CheckUser = { ...userInput, passhash: Model.hashGen(userInput.password) }
  // 检查用户是否已经存在
  const [queryUserErr, queryUserRet] = await checkUserBySuffix(CheckUser.role, CheckUser.suffix, CheckUser.username)
  if (queryUserErr) {
    return [queryUserErr, 0]
  }
  if (queryUserRet.Items.length) {
    return [BizErr.UserExistErr(), 0]
  }
  // 如果是创建商户，检查msn是否可用
  if (CheckUser.role === RoleCodeEnum['Merchant']) {
    const [checkMSNErr, checkMSNRet] = await CheckMSN({ msn: CheckUser.msn })
    if (checkMSNErr) {
      return [checkMSNErr, 0]
    }
    if (!Boolean(checkMSNRet)) {
      return [BizErr.MsnExistErr(), 0]
    }
  }
  // 如果parent未指定,则为管理员. 从当前管理员对点数中扣去点数进行充值. 点数不可以为负数.而且一定是管理员存点到新用户
  const [queryParentErr, parentUser] = await queryParent(token, CheckUser.parent)
  if (queryParentErr) {
    return [queryParentErr, 0]
  }
  // 无论填入多少点数. 产生用户时, 点数的起始为0.0
  const depositPoints = parseFloat(CheckUser.points)
  console.log('registerUser: points: ', depositPoints);
  const User = {
    ...CheckUser,
    username: `${CheckUser.suffix}_${CheckUser.username}`,
    parentName: parentUser.username,
    points: 0.0
  }
  const [saveUserErr, saveUserRet] = await saveUser(User)
  if (saveUserErr) {
    return [saveUserErr, 0]
  }
  const [queryBalanceErr, balance] = await CheckBalance(token, parentUser)
  if (queryBalanceErr) {
    return [queryBalanceErr, 0]
  }
  const [depositErr, depositRet] = await DepositTo(parentUser, {
    toUser: saveUserRet.username,
    toRole: saveUserRet.role,
    amount: Math.min(depositPoints, balance), // 有多少扣多少
    operator: token.username
  })
  var orderId = depositRet.sn
  if (depositErr) {
    orderId = '-1'
  }
  return [0, { ...saveUserRet, orderId: orderId }]
}

/**
 * 用户登录
 * @param {*} userLoginInfo 用户登录信息
 */
export const LoginUser = async (userLoginInfo = {}) => {
  console.info(userLoginInfo)
  // 检查验证码
  const [checkErr, checkRet] = await new CaptchaModel().checkCaptcha(userLoginInfo)
  if (checkErr) {
    return [checkErr, 0]
  }
  // 获取用户身份
  const roleCode = userLoginInfo.role
  const [roleNotFoundErr, Role] = await getRole(roleCode)
  if (roleNotFoundErr) {
    return [roleNotFoundErr, 0]
  }
  // 组装用户登录信息
  const UserLoginInfo = Pick({
    ...Role,
    ...userLoginInfo
  }, Keys(Role))
  const username = UserLoginInfo.username
  const suffix = UserLoginInfo.suffix
  // 查询用户信息
  const [queryUserErr, queryUserRet] = await queryUserBySuffix(roleCode, suffix, username)
  if (queryUserErr) {
    return [queryUserErr, 0]
  }
  if (queryUserRet.Items.length === 0) {
    return [BizErr.UserNotFoundErr(), 0]
  }
  if (queryUserRet.Items.length > 1) {
    return [BizErr.DBErr(), 0]
  }
  const User = queryUserRet.Items[0]
  // 检查非管理员的有效期
  const [periodErr, periodRet] = await new UserModel().checkContractPeriod(User)
  if (periodErr) {
    return [periodErr, User]
  }
  // 校验用户密码
  const valid = await Model.hashValidate(UserLoginInfo.password, User.passhash)
  if (!valid) {
    return [BizErr.PasswordErr(), 0]
  }
  // 更新用户信息
  const [saveUserErr, saveUserRet] = await saveUser(User)
  if (saveUserErr) {
    return [saveUserErr, User]
  }
  // 返回用户身份令牌
  return [0, { ...saveUserRet, token: Model.token(saveUserRet) }]
}

/**
 * 获取用户TOKEN
 * @param {*} userInfo 
 */
export const UserGrabToken = async (userInfo = {}) => {
  if (!userInfo.username || !userInfo.apiKey || !userInfo.suffix) {
    return [BizErr.ParamErr('missing params'), 0]
  }
  // 获取角色模型 能够访问这个接口的只有商户
  const Role = RoleModels[RoleCodeEnum['Merchant']]()
  const roleDisplay = RoleDisplay[RoleCodeEnum['Merchant']]
  // 是否有apiKey
  if (!Role.apiKey) {
    return [BizErr.ParamErr('wrong role'), 0]
  }
  const username = userInfo.username
  const apiKey = userInfo.apiKey
  const role = RoleCodeEnum['Merchant']
  const suffix = userInfo.suffix
  // 根据角色，前缀，apikey查询
  const query = {
    TableName: Tables.ZeusPlatformUser,
    IndexName: 'RoleSuffixIndex',
    KeyConditionExpression: '#suffix = :suffix and #role = :role',
    FilterExpression: '#username = :username and #apiKey = :apiKey',
    ExpressionAttributeNames: {
      '#role': 'role',
      '#suffix': 'suffix',
      '#username': 'username',
      '#apiKey': 'apiKey'
    },
    ExpressionAttributeValues: {
      ':suffix': suffix,
      ':role': role,
      ':username': `${suffix}_${username}`,
      ':apiKey': userInfo.apiKey
    }
  }
  const [queryErr, User] = await Store$('query', query)
  if (queryErr) {
    return [queryErr, 0]
  }
  if (User.Items.length - 1 != 0) {
    return [BizErr.UserNotFoundErr(), 0]
  }
  // 更新用户登录信息
  const UserLastLogin = { ...User.Items[0], lastIP: userInfo.lastIP }
  const [saveUserErr, savedUser] = await saveUser(UserLastLogin)
  if (saveUserErr) {
    return [saveUserErr, 0]
  }
  // 返回身份令牌
  return [0, { ...savedUser, token: Model.token(savedUser) }
  ]
}

// ==================== 以下为内部方法 ====================

// 检查用户数据合法性
const userParamCheck = (userInfo) => {
  if (userInfo.adminName === Model.StringValue) {
    return [BizErr.ParamErr('adminName must set'), 0]
  }
  if (userInfo.suffix === Model.StringValue) {
    return [BizErr.NoSuffixErr(), 0]
  }
  if (Trim(userInfo.username).length < Model.USERNAME_LIMIT[0]) {
    return [BizErr.UsernameTooShortErr(), 0]
  }
  if (Trim(userInfo.username).length > Model.USERNAME_LIMIT[1]) {
    return [BizErr.UsernameTooLongErr(), 0]
  }
  if (userInfo.password.length < Model.PASSWORD_PATTERN[0]) {
    return [BizErr.ParamErr(), 0]
  }
  return [0, 0]
}

// 查询用户上级
const queryParent = async (token, userId) => {
  var id = 0, role = -1
  if (!userId || Model.DefaultParent == userId) {
    id = token.userId
    role = token.role
  } else {
    id = userId
    // 能够有子节点的只能是管理员或者线路商
    role = RoleCodeEnum['Manager']
  }
  const [err, user] = await queryUserById(id, role)
  if (err) {
    return [err, 0]
  }
  return [0, user]
}

// 根据角色码获取角色
const getRole = async (code) => {
  if (!RoleModels[code]) {
    return [BizErr.ParamErr('Role is not found'), 0]
  }
  return [0, RoleModels[code]()]
}

// 保存用户
const saveUser = async (userInfo) => {
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
  var method = 'put'
  // 如果是商户，还需要保存线路号
  if (RoleCodeEnum['Merchant'] === userInfo.role) {
    saveConfig = {
      RequestItems: {
        'ZeusPlatformUser': [
          {
            PutRequest: {
              Item: UserItem
            }
          }
        ],
        'ZeusPlatformMSN': [
          {
            PutRequest: {
              Item: {
                ...baseModel,
                updatedAt: Model.timeStamp(),
                msn: userInfo.msn.toString(),
                userId: userInfo.userId,
                status: MSNStatusEnum['Used'],
                displayName: userInfo.displayName,
                displayId: userInfo.displayId
              }
            }
          }
        ]
      }
    }
    method = 'batchWrite'
  }
  // 保存用户
  const [saveUserErr, Ret] = await Store$(method, saveConfig)
  if (saveUserErr) {
    return [saveUserErr, 0]
  }
  const ret = Pick(UserItem, roleDisplay)
  return [0, ret]
}

// 检查用户是否重复
const checkUserBySuffix = async (role, suffix, username) => {
  // 对于平台管理员来说。 可以允许suffix相同，所以需要角色，前缀，用户名联合查询
  if (role === RoleCodeEnum['PlatformAdmin']) {
    return await queryUserBySuffix(role, suffix, username)
  }
  // 对于其他用户，角色和前缀具有联合唯一性
  const query = {
    TableName: Tables.ZeusPlatformUser,
    IndexName: 'RoleSuffixIndex',
    KeyConditionExpression: '#suffix = :suffix and #role = :role',
    ExpressionAttributeNames: {
      '#role': 'role',
      '#suffix': 'suffix'
    },
    ExpressionAttributeValues: {
      ':suffix': suffix,
      ':role': role
    }
  }
  return await Store$('query', query)
}

// 根据角色，前缀，用户名查询唯一用户
const queryUserBySuffix = async (role, suffix, username) => {
  const query = {
    TableName: Tables.ZeusPlatformUser,
    IndexName: 'RoleSuffixIndex',
    KeyConditionExpression: '#suffix = :suffix and #role = :role',
    FilterExpression: '#username = :username',
    ExpressionAttributeNames: {
      '#role': 'role',
      '#suffix': 'suffix',
      '#username': 'username'
    },
    ExpressionAttributeValues: {
      ':suffix': suffix,
      ':role': role,
      ':username': `${suffix}_${username}`
    }
  }
  return await Store$('query', query)
}

// 根据角色和用户ID查询唯一用户
const queryUserById = async (userId, role) => {
  const query = {
    TableName: Tables.ZeusPlatformUser,
    IndexName: 'UserIdIndex',
    KeyConditionExpression: 'userId = :userId',
    FilterExpression: '#role = :role',
    ExpressionAttributeNames: {
      '#role': 'role'
    },
    ExpressionAttributeValues: {
      ':userId': userId,
      ':role': role
    }
  }
  const [queryErr, ret] = await Store$('query', query)
  if (queryErr) {
    return [queryErr, 0]
  }
  if (ret.Items.length - 1 != 0) {
    return [BizErr.ItemExistErr('user more than one'), 0]
  }
  return [0, ret.Items[0]]
}
