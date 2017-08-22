import {
  Store$,
  Tables,
  Codes,
  BizErr,
  Model,
  Trim,
  Pick,
  Keys,
  Omit,
  StatusEnum,
  RoleCodeEnum,
  RoleModels,
  RoleDisplay,
  MSNStatusEnum
} from '../lib/all'
import { CaptchaModel } from '../model/CaptchaModel'
import { UserModel } from '../model/UserModel'
import { MsnModel } from '../model/MsnModel'
import { BillModel } from '../model/BillModel'
import { PushModel } from '../model/PushModel'

/**
 * 管理员注册
 * @param {*} token 身份令牌
 * @param {*} userInfo 输入用户信息
 */
export const RegisterAdmin = async (token = {}, userInfo = {}) => {
  // 默认值设置
  const adminRole = RoleModels[RoleCodeEnum['PlatformAdmin']]()
  const userInput = Pick({
    ...adminRole,
    ...Omit(userInfo, ['userId', 'points', 'role', 'suffix', 'passhash']) // 这几个都是默认值
  }, Keys(adminRole))
  const CheckUser = { ...userInput, passhash: Model.hashGen(userInput.password) }
  // 查询用户是否已存在
  const [queryUserErr, queryUserRet] = await new UserModel().checkUserBySuffix(CheckUser.role, CheckUser.suffix, CheckUser.username)
  if (queryUserErr) {
    return [queryUserErr, 0]
  }
  if (!queryUserRet) {
    return [BizErr.UserExistErr(), 0]
  }
  // 保存用户，处理用户名前缀
  const User = { ...CheckUser, uname: `${CheckUser.username}`, username: `${CheckUser.suffix}_${CheckUser.username}` }
  const [saveUserErr, saveUserRet] = await saveUser(User)
  if (saveUserErr) {
    return [saveUserErr, 0]
  }
  return [0, saveUserRet]
}

/**
 * 建站商/商户注册
 * @param {*} token 身份令牌
 * @param {*} userInfo 输入用户信息
 */
export const RegisterUser = async (token = {}, userInfo = {}) => {
  // 生成注册用户信息
  const bizRole = RoleModels[userInfo.role]()
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
  // 如果是创建商户，检查msn是否可用
  if (CheckUser.role === RoleCodeEnum['Merchant']) {
    const [checkMSNErr, checkMSNRet] = await new MsnModel().checkMSN({ msn: CheckUser.msn })
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

  // 如果是线路商创建商户，检查可用余额
  // if (parentUser.role === RoleCodeEnum['Manager'] && CheckUser.role === RoleCodeEnum['Merchant']) {
  //   // 查询已用商户已用数量
  //   let merchantUsedCount = 0
  //   const [err, ret] = await new UserModel().listChildUsers(parentUser, RoleCodeEnum['Merchant'])
  //   if (ret && ret.length > 0) {
  //     merchantUsedCount = ret.length
  //   }
  //   if (merchantUsedCount >= parentUser.limit) {
  //     return [BizErr.InparamErr('商户可用名额不足'), 0]
  //   }
  // }

  // 初始点数
  const initPoints = CheckUser.points
  // 检查余额
  const [queryBalanceErr, balance] = await new BillModel().checkBalance(token, parentUser)
  if (queryBalanceErr) {
    return [queryBalanceErr, 0]
  }
  if (initPoints > balance) {
    return [BizErr.BalanceErr(), 0]
  }

  // 保存用户，处理用户名前缀
  const User = {
    ...CheckUser,
    uname: `${CheckUser.username}`,
    username: `${CheckUser.suffix}_${CheckUser.username}`,
    parentName: parentUser.username,
    parentDisplayName: parentUser.displayName,
    parentSuffix: parentUser.suffix,
    points: Model.NumberValue,
    level: parentUser.level + 1,
    levelIndex: parentUser.levelIndex ? parentUser.levelIndex + ',' + parentUser.userId : Model.DefaultParent
  }
  //推送给游戏服务器(A3)
  // let pushModel = new PushModel(User);
  // let [pushErr, data] = await pushModel.push();
  // if(pushErr) {
  //   return [pushErr, 0]
  // }
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
 * 用户登录
 * @param {*} userLoginInfo 用户登录信息
 */
export const LoginUser = async (userLoginInfo = {}) => {
  // 检查验证码
  const [checkErr, checkRet] = await new CaptchaModel().checkCaptcha(userLoginInfo)
  if (checkErr) {
    return [checkErr, 0]
  }
  // 获取用户身份
  const Role = RoleModels[userLoginInfo.role]()
  // 组装用户登录信息
  const LoginInfo = Pick({
    ...Role,
    ...userLoginInfo
  }, Keys(Role))
  const username = LoginInfo.username
  const suffix = LoginInfo.suffix
  // 查询用户信息
  const [queryUserErr, queryUserRet] = await new UserModel().queryUserBySuffix(LoginInfo.role, suffix, username)
  if (queryUserErr) {
    return [queryUserErr, 0]
  }
  if (queryUserRet.Items.length === 0) {
    return [BizErr.UserNotFoundErr('创建人不存在'), 0]
  }
  const User = queryUserRet.Items[0]
  // 校验用户密码
  const valid = await Model.hashValidate(LoginInfo.password, User.passhash)
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
  // 如果是商户，检查白名单
  // let whiteFlag = false
  // if (roleCode == RoleCodeEnum.Merchant) {
  //   // 白名单为空，默认放行
  //   if (!User.loginWhiteList) {
  //     whiteFlag = true
  //   }
  //   // 白名单不为空，则校验
  //   else {
  //     let whiteList = User.loginWhiteList
  //     let whiteArr = whiteList.split(';')
  //     for (let white of whiteArr) {
  //       if (white == '0.0.0.0') {
  //         whiteFlag = true
  //         break
  //       }
  //       if (white == User.lastIP) {
  //         whiteFlag = true
  //         break
  //       }
  //     }
  //   }
  // }
  // // 非商户，不检查白名单
  // else {
  //   whiteFlag = true
  // }
  // if (!whiteFlag) {
  //   return [BizErr.UserIPErr('IP不合法：' + User.lastIP), User]
  // }
  // 更新用户信息
  User.lastIP = LoginInfo.lastIP
  const [saveUserErr, saveUserRet] = await Store$('put', { TableName: Tables.ZeusPlatformUser, Item: User })
  if (saveUserErr) {
    return [saveUserErr, 0]
  }
  // const [saveUserErr, saveUserRet] = await saveUser(User)
  // if (saveUserErr) {
  //   return [saveUserErr, User]
  // }
  // 返回用户身份令牌
  return [0, { ...User, token: Model.token(Pick(User, RoleDisplay[User.role])) }]
}

/**
 * 获取用户TOKEN
 * @param {*} userInfo 
 */
/*
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
  const [saveUserErr, saveUserRet] = await Store$('put', { TableName: Tables.ZeusPlatformUser, Item: UserLastLogin })
  if (saveUserErr) {
    return [saveUserErr, 0]
  }
  // const [saveUserErr, savedUser] = await saveUser(UserLastLogin)
  // if (saveUserErr) {
  //   return [saveUserErr, 0]
  // }
  // 返回身份令牌
  return [0, { ...UserLastLogin, token: Model.token(UserLastLogin) }
  ]
}
*/

// ==================== 以下为内部方法 ====================

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
  // 线路商或商户，从编码池获取新编码
  let [uucodeErr, uucodeRet] = [0, 0]
  if (RoleCodeEnum['Manager'] == userInfo.role || RoleCodeEnum['Merchant'] == userInfo.role) {
    [uucodeErr, uucodeRet] = await Model.uucode('displayId', 6)
    if (uucodeErr) {
      return [uucodeErr, 0]
    }
    userInfo.displayId = parseInt(uucodeRet)
  }

  // 组装用户信息
  const baseModel = Model.baseModel()
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
  // End:记录生成的编码
  if (uucodeRet) {
    Store$('put', { TableName: Tables.ZeusPlatformCode, Item: { type: 'displayId', code: uucodeRet } })
  }

  const roleDisplay = RoleDisplay[userInfo.role]
  const ret = Pick(UserItem, roleDisplay)
  return [0, ret]
}
