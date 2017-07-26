import {
  Tables,
  Store$,
  Codes,
  BizErr,
  RoleCodeEnum,
  MSNStatusEnum,
  RoleModels,
  Trim,
  Empty,
  Model,
  BillModel,
  BillActionEnum,
  Keys,
  Pick,
  Omit
} from '../lib/all'
import _ from 'lodash'

/**
 * 查询管理员详情
 * @param {*} token 
 */
export const TheAdmin = async (token) => {
  return await GetUser(token.userId, token.role)
}

/**
 * 查询管理员列表
 * @param {*} token 
 */
export const ListAllAdmins = async (token) => {
  const query = {
    TableName: Tables.ZeusPlatformUser,
    KeyConditionExpression: '#role = :role',
    ExpressionAttributeNames: {
      '#role': 'role'
    },
    ExpressionAttributeValues: {
      ':role': RoleCodeEnum['PlatformAdmin']
    }
  }
  const [queryErr, adminRet] = await Store$('query', query)
  if (queryErr) {
    return [queryErr, 0]
  }
  return [0, adminRet.Items]
}

/**
 * 查看下级用户
 * @param {*} token 
 * @param {*} roleCode 
 */
export const ListChildUsers = async (token, roleCode) => {
  var parentId = token.userId
  var query = {
    TableName: Tables.ZeusPlatformUser,
    IndexName: 'RoleParentIndex',
    KeyConditionExpression: '#role = :role and parent = :parent',
    ExpressionAttributeNames: {
      '#role': 'role'
    },
    ExpressionAttributeValues: {
      ':parent': parentId,
      ':role': roleCode
    }
  }
  if (RoleCodeEnum['PlatformAdmin'] === token.role) {
    query = {
      TableName: Tables.ZeusPlatformUser,
      IndexName: 'RoleParentIndex',
      KeyConditionExpression: '#role = :role',
      ExpressionAttributeNames: {
        '#role': 'role'
      },
      ExpressionAttributeValues: {
        ':role': roleCode
      }
    }
  }
  const [queryErr, queryRet] = await Store$('query', query)
  if (queryErr) {
    return [queryErr, 0]
  }
  const users = _.map(queryRet.Items, (item) => {
    return Omit(item, ['passhash'])
  })
  return [0, users]
}

/**
 * 查看可用管理员
 */
export const ListAvalibleManagers = async () => {
  const query = {
    TableName: Tables.ZeusPlatformUser,
    IndexName: 'RoleSuffixIndex',
    KeyConditionExpression: '#role = :role',
    ExpressionAttributeNames: {
      '#role': 'role'
    },
    ExpressionAttributeValues: {
      ':role': RoleCodeEnum['Manager']
    }
  }
  const [queryErr, queryRet] = await Store$('query', query)
  if (queryErr) {
    return [queryErr, 0]
  }
  const viewList = _.map(queryRet.Items, (item) => {
    return {
      value: item.userId,
      label: item.suffix
    }
  })
  return [0, viewList]
}

/**
 * 用户更新
 * @param {*} userData 
 */
export const UserUpdate = async (userData) => {
  const User = {
    ...userData,
    updatedAt: Model.timeStamp()
  }
  const put = {
    TableName: Tables.ZeusPlatformUser,
    Item: User
  }
  const [err, updateRet] = await Store$('put', put)
  if (err) {
    return [err, 0]
  }
  return [0, updateRet]
}

/**
 * 查询用户
 * @param {*} userId 
 */
export const QueryUserById = async (userId) => {
  const query = {
    TableName: Tables.ZeusPlatformUser,
    IndexName: 'UserIdIndex',
    KeyConditionExpression: 'userId = :userId',
    ExpressionAttributeValues: {
      ':userId': userId
    }
  }
  const [err, querySet] = await Store$('query', query)
  if (err) {
    return [err, 0]
  }
  if (querySet.Items.length - 1 != 0) {
    return [BizErr.UserNotFoundErr(), 0]
  }
  return [0, querySet.Items[0]]
}

/**
 * 查询用户
 * @param {*} userId 
 * @param {*} role 
 */
export const GetUser = async (userId, role) => {
  const query = {
    TableName: Tables.ZeusPlatformUser,
    KeyConditionExpression: '#userId = :userId and #role = :role',
    ExpressionAttributeValues: {
      ':role': role,
      ':userId': userId
    },
    ExpressionAttributeNames: {
      '#userId': 'userId',
      '#role': 'role'
    }
  }
  const [queryErr, queryRet] = await Store$('query', query)
  if (queryErr) {
    return [queryErr, 0]
  }
  if (queryRet.Items.length - 1 != 0) {
    return [BizErr.UserNotFoundErr(), 0]
  }
  const User = queryRet.Items[0]
  return [0, User]
}

/**
 * 检查MSN
 * @param {*} param 
 */
export const CheckMSN = async (param) => {
  // get a number from event
  // const [formatErr,msn] = FormatMSN(param)
  // if (formatErr) {
  //   return [formatErr,0]
  // }
  const query = {
    TableName: Tables.ZeusPlatformMSN,
    KeyConditionExpression: '#msn = :msn',
    FilterExpression: '#status = :usedStatus or #status = :lockStatus',
    ExpressionAttributeNames: {
      '#msn': 'msn',
      '#status': 'status'
    },
    ExpressionAttributeValues: {
      ':msn': param.msn.toString(),
      ':usedStatus': MSNStatusEnum['Used'],
      ':lockStatus': MSNStatusEnum['Locked']
    }
  }
  const [queryErr, queryRet] = await Store$('query', query)
  if (queryErr) {
    return [queryErr, 0]
  }
  return [0, (queryRet.Items.length == 0)]
}

/**
 * 格式化线路号
 * @param {*} param 
 */
export const FormatMSN = function (param) {
  try {
    if (isNaN(parseFloat(param.msn)) || 1000.0 - parseFloat(param.msn) >= 1000.0 || 1000.0 - parseFloat(param.msn) <= 0) {
      return [BizErr.ParamErr('msn is [1,999]')]
    }
    const formatedMsn = ((parseFloat(param.msn) * 0.001).toFixed(3) + '').substring(2)
    return [0, formatedMsn]
  } catch (e) {
    return [BizErr.ParamErr(e.toString()), 0]
  }
}

