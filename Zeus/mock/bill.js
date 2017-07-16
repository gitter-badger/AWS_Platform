import { BillTypeEnum } from '../lib/all'
export const Bill = {
  balance: 6000.00, // 最新余额
  oldBalance: 5000.00, // 旧余额
  createdAt: 1499156312967, // 交易时间
  billType:BillTypeEnum.Withdraw, //
  from: 'from account', // 交易发起账户
  to: 'to account', // 交易对象账户
  fromRole: 'role code', // 发起账户的角色
  toRole: 'role code', // 对象账户的角色
  points: 1000.00 | -100.00, // 金额
  billDetail: '5000 + 1000 = 6000',  // 交易详情
  operator: 'operator name' // 操作人
}
