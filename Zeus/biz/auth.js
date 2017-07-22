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
/**
  现在注册分成两部分
  1. 管理员注册
  2. 商户/建站商注册
**/

const userParamCheck = (userInfo)=>{
  if (userInfo.adminName === Model.StringValue) {
    return [BizErr.ParamErr('adminName must set'),0]
  }

  if (userInfo.suffix === Model.StringValue) {
    return [BizErr.NoSuffixErr(),0]
  }
  if (Trim(userInfo.username).length < Model.USERNAME_LIMIT[0]) {
    return [ BizErr.UsernameTooShortErr(), 0 ]
  }
  if (Trim(userInfo.username).length > Model.USERNAME_LIMIT[1]) {
    return [BizErr.UsernameTooLongErr() , 0 ]
  }
  if (userInfo.password.length < Model.PASSWORD_PATTERN[0]) {
    return [BizErr.ParamErr(),0]
  }
  return [0,0]
}
const queryParent = async(token,userId) => {
  var id = 0,role = -1
  if (!userId || Model.DefaultParent == userId) {
    id = token.userId
    role = token.role
  }else {
    id = userId
    // 能够有子节点的只能是管理员或者线路商
    role = RoleCodeEnum['Manager']
  }

  const [err,user] = await queryUserById(id,role)
  if (err) {
    return [err,0]
  }
  return [0,user]
}
export const RegisterAdmin = async(token={},userInfo={}) =>{
  //创建管理员账号的只能是管理员
  if (token.role !== RoleCodeEnum['PlatformAdmin']) {
    return [BizErr.TokenErr('must admin token'),0]
  }
  const adminRole = RoleModels[RoleCodeEnum['PlatformAdmin']]()
  const userInput = Pick({
    ...adminRole,
    ...Omit(userInfo,['userId','points','role','suffix','passhash']) // 这几个都是默认值
  },Keys(adminRole))
  // check user
  const [userParamErr,_] = userParamCheck(userInput)
  if (userParamErr) {
    return [userParamErr,0]
  }
  const CheckUser = {
    ...userInput,
    passhash: Model.hashGen(userInput.password)
  }
  const [queryUserErr,queryUserRet] = await checkUserBySuffix(CheckUser.role,CheckUser.suffix,CheckUser.username)
  if (queryUserErr) {
    return [queryUserErr,0]
  }
  if (queryUserRet.Items.length) {
    return [BizErr.UserExistErr() , 0 ]
  }
  // save user
  const User = {
    ...CheckUser,
    username: `${CheckUser.suffix}_${CheckUser.username}`
  }
  const [saveUserErr,saveUserRet] = await saveUser(User)
  if (saveUserErr) {
    return [saveUserErr,0]
  }
  return [0,saveUserRet]
}
// 专门用于创建商户/建站商
export const RegisterUser = async(token = {},userInfo = {}) => {
  //创建管理员账号的只能是管理员
  if (token.role !== RoleCodeEnum['PlatformAdmin']) {
    return [BizErr.TokenErr('must admin token'),0]
  }
  if (userInfo.points < 0) {
    return [BizErr.ParamErr('points cant less then 0 for new user'),0]
  }
  // check the role code
  const roleCode = userInfo.role
  if (roleCode === RoleCodeEnum['PlatformAdmin']) {
    return [BizErr.ParamErr('admin role cant create by this api'),0]
  }
  // find the role in the role table
  const [roleNotFoundErr, bizRole] = await getRole(roleCode)
  if (roleNotFoundErr) {
    return [roleNotFoundErr, 0]
  }
  userInfo = Omit(userInfo,['userId','passhash'])
  const userInput = Pick({
    ...bizRole,
    ...userInfo
  },Keys(bizRole))


  const [userParamErr,_] = userParamCheck(userInput)
  if (userParamErr) {
    return [userParamErr,0]
  }

  // when get the role. can use it the puck attr from userInfo and build the User Model
  const CheckUser = {
    ...userInput,
    passhash: Model.hashGen(userInput.password)
  }

  // check if the user is exists
  const [queryUserErr,queryUserRet] = await checkUserBySuffix(CheckUser.role,CheckUser.suffix,CheckUser.username)
  if (queryUserErr) {
    return [queryUserErr,0]
  }
  if (queryUserRet.Items.length) {
    return [BizErr.UserExistErr() , 0 ]
  }
  // 检查msn是否可用
  if (CheckUser.role === RoleCodeEnum['Merchant']) {
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
  // 如果parent未指定,则为管理员. 从当前管理员对点数中扣去点数进行充值. 点数不可以为负数.而且一定是管理员存点到新用户
  const [queryParentErr,parentUser] = await queryParent(token,CheckUser.parent)
  if (queryParentErr) {
    return [queryParentErr,0]
  }
  // 无论填入多少点数. 产生用户时, 点数的起始为0.0
  const depositPoints = parseFloat(CheckUser.points)
  const User = {
    ...CheckUser,
    username: `${CheckUser.suffix}_${CheckUser.username}`,
    parentName: parentUser.username,
    points:0.0
  }
  const [saveUserErr, saveUserRet] = await saveUser(User)
  if (saveUserErr) {
    return [saveUserErr, 0]
  }
  const [queryBalanceErr,balance] = await CheckBalance(token,parentUser)
  if (queryBalanceErr) {
    return [queryBalanceErr,0]
  }
  const [depositErr,depositRet] = await DepositTo(parentUser,{
    toUser: saveUserRet.username,
    toRole: saveUserRet.role,
    amount: Math.min(depositPoints,balance), // 有多少扣多少
    operator: token.username
  })
  var orderId = depositRet.sn
  if (depositErr) {
    orderId = '-1'
  }
  return [0,{
    ...saveUserRet,
    orderId:orderId
  }]
}


/**
LoginUser
*/
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
  const Role =  RoleModels[RoleCodeEnum['Merchant']]()
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
  return [ 0, RoleModels[code]() ]
}
const saveUser = async(userInfo) => {
  const baseModel = Model.baseModel()
  const roleDisplay = RoleDisplay[userInfo.role]
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

const queryUserById = async (userId,role) => {
console.log(userId,role);
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
      ':role': role
    }
  }
  const [queryErr,ret] = await Store$('query',query)
  if (queryErr) {
    return [queryErr,0]
  }
  if (ret.Items.length - 1 != 0) {
    return [BizErr.ItemExistErr('user more than one'),0]
  }
  return  [0,ret.Items[0]]
}
