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
import { CheckMSN,CheckBalance, DepositTo } from './dao'
export const RegisterUser = async(userInfo = {},token = {}) => {
  if (userInfo.points < 0) {
    return [BizErr.ParamErr('points cant less then 0 for new user'),0]
  }
  // check the role code
  const roleCode = userInfo.role

  if (roleCode === RoleCodeEnum['PlatformAdmin'] && userInfo.suffix) {
    userInfo = Omit(userInfo,['suffix'])
    return [BizErr.ParamErr('suffix cant change as platform admin user'),0]
  }
  if (roleCode === RoleCodeEnum['PlatformAdmin'] && userInfo.parent) {
    userInfo = Omit(userInfo,['parent'])
    return [BizErr.ParamErr('parent cant change as platform admin user'),0]
  }
  // find the role in the role table
  const [roleNotFoundErr, Role] = await getRole(roleCode)
  if (roleNotFoundErr) {
    return [roleNotFoundErr, 0]
  }
  userInfo = Omit(userInfo,['userId'])
  const UserInfo = Pick({
    ...Role,
    ...userInfo
  },Keys(Role))


  if (UserInfo.suffix === Model.StringValue) {
    return [BizErr.NoSuffixErr(),0]
  }

  if (UserInfo.adminName === Model.StringValue) {
    return [BizErr.ParamErr('adminName must set'),0]
  }


  if (Trim(UserInfo.username).length < Model.USERNAME_LIMIT[0]) {
    return [ BizErr.UsernameTooShortErr(), 0 ]
  }
  if (Trim(UserInfo.username).length > Model.USERNAME_LIMIT[1]) {
    return [BizErr.UsernameTooLongErr() , 0 ]
  }
  if (UserInfo.password.length < Model.PASSWORD_PATTERN[0]) {
    return [BizErr.ParamErr(),0]
  }

  // when get the role. can use it the puck attr from userInfo and build the User Model
  const User = {
    ...UserInfo,
    passhash: Model.hashGen(UserInfo.password)
  }

  // check if the user is exists
  const suffix = User.suffix
  const [queryUserErr, queryUserRet] = await checkUserBySuffix(roleCode,suffix,User.username)
  if (queryUserErr) {
    return [queryUserErr, 0]
  }
  if (queryUserRet.Items.length) {
    return [BizErr.UserExistErr() , 0 ]
  }
  // 检查新建用户的parent 如果parent为DefaultParent或者NoParent 就指定当前操作用户作为parent
  const [queryParentErr,queryParentRet] = await queryUserById(User.parent)
  if (queryParentErr) {
    return [queryParentErr,0]
  }
  if (queryParentRet.Items.length - 1 != 0) {
    return [BizErr.UserNotFoundErr('parent not found'),0]
  }
  const parentUser = queryParentRet.Items[0]
  // 检查作为parent的账户是否有足够的点数 但是 如果创建的是平台管理员账号则不需要检查 直接赋予此账号10000000点
  if (RoleCodeEnum['PlatformAdmin'] == roleCode) {
    User.points = 100000000.00
  } else {
    /**
     根据points参数的正负
     + 表示从当前操作账户向新建账户存点 (deposit)
     - 表示从新建账户中往操作账户提点 (withdraw)
     由于是新建账户 所以我们不允许第一次就是从新建账户提点 因为默认的新增账户的点数为0
     其次,新建的管理员是没有办法指定新建自己时的点数的.
     综合以上两点, 新增时的points一定大于等于0. 因此一定是deposit 需要检查的是当前操作账号的余额
    **/
    const [balanceErr,parentBalance] = await CheckBalance(token,parentUser.userId)
    if (balanceErr) {
      return [balanceErr,0]
    }
    if (UserInfo.points > parentBalance) {
      return [BizErr.InsufficientBalanceErr(),0]
    }

  }
  // 检查msn是否可用
  if (roleCode === RoleCodeEnum['Merchant']) {
    const [checkMSNErr,checkMSNRet] = await CheckMSN({
      msn: User.msn
    })
    if (checkMSNErr) {
      return [checkMSNErr,0]
    }
    if (!Boolean(checkMSNRet)) {
      return [BizErr.MsnExistErr(),0]
    }
  }


  const parentName = queryParentRet.Items[0].username

  const [saveUserErr, saveUserRet] = await saveUser(
    {
      ...User,
      userId: Model.uuid(),
      username: `${User.suffix}_${User.username}`,
      parentName:parentName
    })
  if (saveUserErr) {
    return [saveUserErr, 0]
  }
  // 管理员角色创建时默认分配点数, 这笔交易不需要记录
  if (RoleCodeEnum['PlatformAdmin'] !== User.role) {
    const [depositErr,depositRet] = await DepositTo(token,{
      toUser: saveUserRet.username,
      toRole: saveUserRet.role,
      amount: User.points,
      operator: token.username
    })
    if (depositErr) {
      return [depositErr,0]
    }
  }

  return [0, saveUserRet]

}

export const LoginUser = async(userLoginInfo = {}) => {
  // check the role code
  const roleCode = userLoginInfo.role
  // find the role in the role table
  const [roleNotFoundErr, Role] = await getRole(roleCode)
  if (roleNotFoundErr) {
    return [roleNotFoundErr, 0]
  }

  const UserLoginInfo = Pick({
    ...Role,
    ...userLoginInfo
  },Keys(Role))
  const username = UserLoginInfo.username
  const suffix = UserLoginInfo.suffix
  const [queryUserErr,queryUserRet] = await queryUserBySuffix(roleCode,suffix,username)
  if (queryUserErr) {
    return [queryUserErr,0]
  }
  if (queryUserRet.Items.length === 0) {
    return [BizErr.UserNotFoundErr(),0]
  }
  if(queryUserRet.Items.length > 1 ) {
    return [BizErr.DBErr(),0]
  }
  const User = queryUserRet.Items[0]
  const valid = await Model.hashValidate(UserLoginInfo.password,User.passhash)
  if (!valid) {
    return [BizErr.UserNotFoundErr(),0]
  }
  const [saveUserErr, saveUserRet] = await saveUser(User)
  if (saveUserErr) {
    return [saveUserErr, 0]
  }

  return [0,{
    ...saveUserRet,
    token: Model.token(saveUserRet)
  }]
}


export const UserGrabToken = async(userInfo = {})=>{
  if (!userInfo.username || !userInfo.apiKey || !userInfo.suffix) {
    return [BizErr.ParamErr('missing params'),0]
  }
  // 获取角色模型 能够访问这个接口的只有商户
  const Role =  RoleModels[RoleCodeEnum['Merchant']]
  const roleDisplay = RoleDisplay[RoleCodeEnum['Merchant']]
  if (!Role.apiKey) { // 是否有apiKey
    return [BizErr.ParamErr('wrong role'),0]
  }
  const username = userInfo.username
  const apiKey = userInfo.apiKey
  const role = RoleCodeEnum['Merchant']
  const suffix = userInfo.suffix

  const query = {
    TableName: Tables.ZeusPlatformUser,
    IndexName: 'RoleSuffixIndex',
    KeyConditionExpression: '#suffix = :suffix and #role = :role',
    FilterExpression:'#username = :username and #apiKey = :apiKey',
    ExpressionAttributeNames:{
      '#role':'role',
      '#suffix':'suffix',
      '#username':'username',
      '#apiKey':'apiKey'
    },
    ExpressionAttributeValues: {
      ':suffix': suffix,
      ':role': role,
      ':username': `${suffix}_${username}`,
      ':apiKey':userInfo.apiKey
    }
  }
  const [queryErr,User] =  await Store$('query',query)
  if (queryErr) {
    return [queryErr,0]
  }
  if (User.Items.length - 1 != 0) {
    return [BizErr.UserNotFoundErr(),0]
  }
  // update the login ip & updatedAt & loginAt
  const UserLastLogin = {
    ...User.Items[0],
    lastIP: userInfo.lastIP
  }
  const [saveUserErr,savedUser] = await saveUser(UserLastLogin)
  if (saveUserErr) {
    return [saveUserErr,0]
  }
  return [0,{
    ...savedUser,
    token: Model.token(savedUser)
  }]
}
const getRole = async(code) => {
  if (!RoleModels[code]) {
      return [BizErr.ParamErr('Role is not found'),0]
  }
  return [ 0, RoleModels[code] ]
}
const saveUser = async(userInfo) => {
  const baseModel = Model.baseModel()
  const roleDisplay = RoleDisplay[userInfo.role]
  console.log('saveUser',userInfo.userId);
  const UserItem =  {
    ...baseModel,
    ...userInfo,
    updatedAt: Model.timeStamp(),
    loginAt: Model.timeStamp()
  }
  var saveConfig = {
    TableName: Tables.ZeusPlatformUser,
    Item: UserItem
  }
  var method = 'put'
  if (RoleCodeEnum['Merchant'] === userInfo.role) {
    saveConfig = {
      RequestItems:{
        'ZeusPlatformUser':[
          {
            PutRequest:{
              Item: UserItem
            }
          }
        ],
        'ZeusPlatformMSN':[
          {
            PutRequest:{
              Item:{
                  ...baseModel,
                  updatedAt: Model.timeStamp(),
                  msn: userInfo.msn,
                  userId:userInfo.userId,
                  status: MSNStatusEnum['Used']
              }
            }
          }
        ]
      }
    }
    method = 'batchWrite'
  }


  const [saveUserErr,saveUserRet] = await Store$(method, saveConfig)
  if (saveUserErr) {
    return [saveUserErr,0]
  }
  const ret = Pick(UserItem,roleDisplay)
  return [0,ret]
}
const checkUserBySuffix = async (role,suffix,username) => {
  if (role === RoleCodeEnum['PlatformAdmin']) { // 对于平台管理员来说。 可以允许suffix相同
    return await queryUserBySuffix(role,suffix,username)
  }

  const query = {
    TableName: Tables.ZeusPlatformUser,
    IndexName: 'RoleSuffixIndex',
    KeyConditionExpression: '#suffix = :suffix and #role = :role',
    ExpressionAttributeNames:{
      '#role':'role',
      '#suffix':'suffix'
    },
    ExpressionAttributeValues: {
      ':suffix': suffix,
      ':role': role
    }
  }
  return await Store$('query', query)
}
const queryUserBySuffix = async(role,suffix,username) => {
  const query = {
    TableName: Tables.ZeusPlatformUser,
    IndexName: 'RoleSuffixIndex',
    KeyConditionExpression: '#suffix = :suffix and #role = :role',
    FilterExpression:'#username = :username',
    ExpressionAttributeNames:{
      '#role':'role',
      '#suffix':'suffix',
      '#username':'username'
    },
    ExpressionAttributeValues: {
      ':suffix': suffix,
      ':role': role,
      ':username': `${suffix}_${username}`
    }
  }
  return await Store$('query', query)
}

const queryUserById = async (userId) => {
  if ( Model.DefaultParent === userId ) {
    return [0,{ Items:[{ username: 'PlatformAdmin' }] }]
  }
  if (Model.NoParent === userId) {
    return [0,{ Items:[{ username: 'SuperAdmin' }] }]
  }
  const query = {
    TableName: Tables.ZeusPlatformUser,
    IndexName: 'UserIdIndex',
    KeyConditionExpression: 'userId = :userId',
    FilterExpression:'#role = :role',
    ExpressionAttributeNames:{
      '#role':'role'
    },
    ExpressionAttributeValues:{
      ':userId':userId,
      ':role': RoleCodeEnum['Manager']

    }
  }
  return await Store$('query',query)
}
