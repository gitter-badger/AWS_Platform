import { Model } from './Dynamo'
// 线路号状态枚举
export const MSNStatusEnum = {
  Used: 1,
  Locked: 2,
  Free: 0
}
// 游戏类型枚举
export const GameTypeEnum = {
  '10000': { code: '10000', name: '棋牌游戏', url: 'http://192.168.3.131/webadmin/public/admin/api/checkLoginAccess', desc: '这是棋牌游戏', imgurl: 'https://www.baidu.com/img/qixi_pad_d84d9e2020231e3c6b22aaec04296f1a.png' },
  '40000': { code: '40000', name: '电子游戏', url: 'http://test.com', desc: '这是电子游戏', imgurl: 'https://www.baidu.com/img/qixi_pad_d84d9e2020231e3c6b22aaec04296f1a.png' },
  '30000': { code: '30000', name: '真人视讯', url: 'http://146.88.71.30:8011/player/login', desc: '这是真人视讯', imgurl: 'https://www.baidu.com/img/qixi_pad_d84d9e2020231e3c6b22aaec04296f1a.png' }
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