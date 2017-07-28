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
import { CheckUserBalance } from './bill'

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
  // 查询每个用户余额
  for (let user of users) {
    let [balanceErr, balance] = await CheckUserBalance(user)
    user.balance = balance
  }
  return [0, users]
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
 * 格式化线路号
 * @param {*} param 
 */
// export const FormatMSN = function (param) {
//   try {
//     if (isNaN(parseFloat(param.msn)) || 1000.0 - parseFloat(param.msn) >= 1000.0 || 1000.0 - parseFloat(param.msn) <= 0) {
//       return [BizErr.ParamErr('msn is [1,999]')]
//     }
//     const formatedMsn = ((parseFloat(param.msn) * 0.001).toFixed(3) + '').substring(2)
//     return [0, formatedMsn]
//   } catch (e) {
//     return [BizErr.ParamErr(e.toString()), 0]
//   }
// }

