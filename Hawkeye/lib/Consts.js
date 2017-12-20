import { Model } from './Dynamo'

export const BillActionEnum = {
  Deposit: -1.0, // 存
  Withdraw: 1.0 // 提
}
export const MSNStatusEnum = {
  Used: 1,
  Locked: 2,
  Free: 0
}
export const ToolIdEnum = {
  diamonds: "100000"
}
// 展位类型枚举
export const SeatTypeEnum = {
  diamonds: "1",
  tool: "2"
}
//展位内容枚举
export const SeatContentEnum = {
  package: "2",
  tool: "1"
}

export const RoleCodeEnum = {
  'SuperAdmin': '0',  //超级管理员
  'PlatformAdmin': '1', //平台管理员
  'Manager': '10',  //线路商
  'Merchant': '100',  //商家
  'Agent': '1000',   //代理
  'Player': '10000'  //玩家
}

export const BillModel = {
  sn: Model.uuid(),
  fromRole: Model.StringValue,
  toRole: Model.StringValue,
  fromUser: Model.StringValue,
  toUser: Model.StringValue,
  action: Model.NumberValue,
  amount: Model.NumberValue,
  operator: Model.StringValue
}

// 游戏类型枚举
export const GameTypeEnum = {
  '10000': { company: 'NA', code: '10000', name: 'NA棋牌游戏', url: 'http://test.com' },
  '30000': { company: 'NA', code: '30000', name: 'NA真人视讯', url: 'http://test.com' },
  '40000': { company: 'NA', code: '40000', name: 'NA电子游戏', url: 'http://test.com' },
  '50000': { company: 'NA', code: '50000', name: 'NA街机游戏', url: 'http://test.com' },
  '1010000': { company: 'TTG', code: '1010000', name: 'TTG电子游戏' }
}
