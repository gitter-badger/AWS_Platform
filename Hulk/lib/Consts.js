import { Model } from './Dynamo'
// 普通状态枚举
export const AdStatusEnum = {
  Enable: 1,
  Disable: 0
}
/**
 * 账单实体
 */
export const BillMo = function () {
  return {
    sn: Model.uuid(),
    fromRole: Model.StringValue,
    toRole: Model.StringValue,
    fromUser: Model.StringValue,
    toUser: Model.StringValue,
    fromLevel: Model.NumberValue,
    toLevel: Model.NumberValue,
    fromDisplayName: Model.StringValue,
    toDisplayName: Model.StringValue,
    action: Model.NumberValue,
    amount: Model.NumberValue,
    operator: Model.StringValue,
    remark: Model.StringValue
  }
}