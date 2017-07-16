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
  RoleModels
} from '../lib/all'

export const RegisterUser = async(userInfo = {}) => {
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
  const [saveUserErr, saveUserRet] = await saveUser(
    {
      ...User,
      username: `${User.suffix}_${User.username}`
    })
  if (saveUserErr) {
    return [saveUserErr, 0]
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

const getRole = async(code) => {
  if (!RoleModels[code]) {
      return [BizErr.ParamErr('Role is not found'),0]
  }
  return [ 0, RoleModels[code] ]
}

const saveUser = async(userInfo) => {
  const baseModel = Model.baseModel()
  const put = {
    TableName: Tables.ZeusPlatformUser,
    Item: {
      ...baseModel,
      ...userInfo,
      updatedAt: Model.timeStamp(),
      loginAt: Model.timeStamp()
    }
  }
  const [saveUserErr,saveUserRet] = await Store$('put', put)
  if (saveUserErr) {
    return [saveUserErr,0]
  }
  const ret = Pick(put.Item,['userId','username','parent','role'])
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
