import {
  Tables,
  Store$,
  Codes,
  BizErr,
  RoleCodeEnum,
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
 * 转账
 */
export const BillTransfer = async (from, billInfo) => {
  if (Empty(billInfo)) {
    return [BizErr.ParamMissErr(), 0]
  }
  // move out user input sn
  billInfo = Omit(billInfo, ['sn', 'fromRole', 'fromUser', 'action'])
  const [toUserErr, to] = await getUserByName(billInfo.toRole, billInfo.toUser)
  if (toUserErr) {
    return [toUserErr, 0]
  }
  const Role = RoleModels[from.role]()
  if (!Role || Role.points === undefined) {
    return [BizErr.ParamErr('role error'), 0]
  }
  const UserProps = Pick({
    ...Role,
    ...from
  }, Keys(Role))
  const initPoints = UserProps.points
  const fromUser = UserProps.username
  const fromRole = UserProps.role
  if (!fromRole || !fromUser) {
    return [BizErr.ParamErr('Param error,invalid transfer. from** null')]
  }
  if (fromUser == billInfo.toUser) {
    return [BizErr.ParamErr('Param error,invalid transfer. self transfer not allowed')]
  }
  const Bill = {
    ...Model.baseModel(),
    ...Pick({
      ...BillModel(),
      ...billInfo,
      fromUser: fromUser,
      fromRole: fromRole,
      action: 0,
      operator: from.operatorToken.username
    }, Keys(BillModel()))
  }
  const batch = {
    RequestItems: {
      'ZeusPlatformBill': [
        {
          PutRequest: {
            Item: {
              ...Bill,
              amount: Bill.amount * (-1.0),
              action: -1,
              userId: from.userId
            }
          }
        },
        {
          PutRequest: {
            Item: {
              ...Bill,
              amount: Bill.amount,
              action: 1,
              userId: to.userId
            }
          }
        }
      ]
    }
  }
  const [err, ret] = await Store$('batchWrite', batch)
  if (err) {
    return [err, 0]
  }
  return [0, Bill]
}

/**
 * 查询用户余额
 * @param {*} user 
 */
export const CheckUserBalance = async (user) => {
  if (user.points == undefined || user.points == null) {
    return [BizErr.ParamErr('User dont have base points'), 0]
  }
  const baseBalance = parseFloat(user.points)
  const query = {
    TableName: Tables.ZeusPlatformBill,
    IndexName: 'UserIdIndex',
    KeyConditionExpression: 'userId = :userId',
    ExpressionAttributeValues: {
      ':userId': user.userId
    }
  }
  const [queryErr, bills] = await Store$('query', query)
  if (queryErr) {
    return [queryErr, 0]
  }
  const sums = _.reduce(bills.Items, (sum, bill) => {
    return sum + parseFloat(bill.amount)
  }, 0.0)

  return [0, baseBalance + sums]
}
// 返回某个账户下的余额
export const CheckBalance = async (token, user) => {
  // 因为所有的转账操作都是管理员完成的 所以 token必须是管理员.
  // 当前登录用户只能查询自己的balance
  if (!(token.role == RoleCodeEnum['PlatformAdmin'] || user.userId === token.userId || user.parent === token.userId)) {
    return [BizErr.TokenErr('only admin or user himself can check users balance'), 0]
  }
  return await CheckUserBalance(user)
}

/**
 * 获取转账用户
 * @param {*} token 
 * @param {*} fromUserId 
 */
export const QueryBillUser = async (token, fromUserId) => {
  if (!fromUserId) {
    fromUserId = token.userId
  }
  const [err, user] = await QueryUserById(fromUserId)
  if (err) {
    return [err, 0]
  }
  if (token.role == RoleCodeEnum['PlatformAdmin']) {
    return [0, user]
  }
  if (!(user.userId == token.userId || user.parent == token.userId)) {
    return [BizErr.TokenErr('current token user  cant operate this user'), 0]
  }
  return [0, user]
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

// ==================== 以下是内部方法 ====================

// 查询用户
const getUserByName = async (role, username) => {
  const query = {
    TableName: Tables.ZeusPlatformUser,
    IndexName: 'RoleUsernameIndex',
    KeyConditionExpression: '#role = :role and #username = :username',
    ExpressionAttributeNames: {
      '#username': 'username',
      '#role': 'role'
    },
    ExpressionAttributeValues: {
      ':username': username,
      ':role': role
    }
  }
  const [queryErr, queryRet] = await Store$('query', query)
  if (queryErr) {
    return [queryErr, 0]
  }
  const User = queryRet.Items[0]
  if (!User) {
    return [BizErr.UserNotFoundErr(), 0]
  }
  return [0, User]
}

// // 存入
// export const DepositTo = async(fromUser,billInfo) => {
//   return await BillTransfer(fromUser,billInfo,BillActionEnum.Deposit)
// }
// // 提出
// export const WithdrawFrom = async(fromUser,billInfo) => {
//   return await BillTransfer(fromUser,billInfo,BillActionEnum.Withdraw)
// }