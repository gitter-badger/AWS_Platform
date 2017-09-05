import { Model } from './Dynamo'
// 线路号状态枚举
export const MSNStatusEnum = {
  Used: 1,
  Locked: 2,
  Free: 0
}
// 游戏类型枚举
export const GameTypeEnum = {
  '10000': { code: '10000', name: '棋牌游戏', url: 'http://root.rottagame.com/admin/api/checkLoginAccess', imgurl: '', desc: '棋牌游戏' },
  '40000': { code: '40000', name: '电子游戏', url: 'http://192.168.3.131/tigergame/public/admin/api/checkLoginAccess', imgurl: '', desc: '电子游戏' },
  '30000': { code: '30000', name: '真人视讯', url: 'http://user.ybvip789.com:8080/player/login', imgurl: '', desc: '真人视讯' }
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