import {
  Tables,
  Store$,
  Codes,
  BizErr,
  Trim,
  Empty,
  Model,
  Keys,
  Pick,
  Omit,
  RoleCodeEnum,
  RoleModels,
  BillModel,
  BillActionEnum
} from '../lib/all'
import _ from 'lodash'
import { UserModel } from '../model/UserModel'

/**
 * 转账
 */
export const BillTransfer = async (from, billInfo) => {
  // 输入数据校验
  if (Empty(billInfo)) {
    return [BizErr.ParamMissErr(), 0]
  }
  // move out user input sn
  billInfo = Omit(billInfo, ['sn', 'fromRole', 'fromUser', 'action'])
  const [toUserErr, to] = await new UserModel().getUserByName(billInfo.toRole, billInfo.toUser)
  if (toUserErr) {
    return [toUserErr, 0]
  }
  const Role = RoleModels[from.role]()
  if (!Role || Role.points === undefined) {
    return [BizErr.ParamErr('role error'), 0]
  }
  const fromInparam = Pick({
    ...Role,
    ...from
  }, Keys(Role))
  if (!fromInparam.role || !fromInparam.username) {
    return [BizErr.ParamErr('Param error,invalid transfer. from** null')]
  }
  if (fromInparam.username == billInfo.toUser) {
    return [BizErr.ParamErr('Param error,invalid transfer. self transfer not allowed')]
  }
  // 数据类型处理
  fromInparam.role = fromInparam.role.toString()
  billInfo.toRole = billInfo.toRole.toString()
  // 存储账单流水
  const Bill = {
    ...Model.baseModel(),
    ...Pick({
      ...BillModel(),
      ...billInfo,
      fromUser: fromInparam.username,
      fromRole: fromInparam.role,
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
              amount: Bill.amount * (1.0),
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