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
  '10000': { code: '10000', name: '棋牌游戏', url: 'http://192.168.3.131/webadmin/public/admin/api/checkLoginAccess' },
  '40000': { code: '40000', name: '电子游戏', url: 'http://test.com' },
  '30000': { code: '30000', name: '真人视讯', url: 'http://146.88.71.30:8011/player/login' }
}
