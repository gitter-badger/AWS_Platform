import { Model } from './Dynamo'
// 线路号状态枚举
export const MSNStatusEnum = {
  Used: 1,
  Locked: 2,
  Free: 0
}

//测试环境
// export const GameTypeEnum = {
//   '10000': { code: '10000', name: '棋牌游戏', url: 'http://47.74.154.114/webadmin/public/admin/api/checkLoginAccess', desc: '这是棋牌游戏', imgurl: 'https://www.baidu.com/img/qixi_pad_d84d9e2020231e3c6b22aaec04296f1a.png' },
//   '40000': { code: '40000', name: '电子游戏', url: 'http://47.74.154.114/tigergame/public/admin/api/checkLoginAccess', desc: '这是电子游戏', imgurl: 'https://www.baidu.com/img/qixi_pad_d84d9e2020231e3c6b22aaec04296f1a.png' },
//   '30000': { code: '30000', name: '真人视讯', url: 'http://52.221.134.197:8080/gate/player/login', desc: '这是真人视讯', imgurl: 'https://www.baidu.com/img/qixi_pad_d84d9e2020231e3c6b22aaec04296f1a.png' }
// }

// 游戏类型枚举:正式环境
// export const GameTypeEnum = {
//   '10000': { code: '10000', name: '棋牌游戏', url: 'http://47.88.175.41/webadmin/public/admin/api/checkLoginAccess', desc: '这是棋牌游戏', imgurl: 'https://www.baidu.com/img/qixi_pad_d84d9e2020231e3c6b22aaec04296f1a.png' },
//   '40000': { code: '40000', name: '电子游戏', url: 'http://47.88.175.41/tigergame/public/admin/api/checkLoginAccess', desc: '这是电子游戏', imgurl: 'https://www.baidu.com/img/qixi_pad_d84d9e2020231e3c6b22aaec04296f1a.png' },
//   '30000': { code: '30000', name: '真人视讯', url: 'http://52.221.134.197:8080/gate/player/login', desc: '这是真人视讯', imgurl: 'https://www.baidu.com/img/qixi_pad_d84d9e2020231e3c6b22aaec04296f1a.png' }
// }

//游戏类型枚举:开发环境
export const GameTypeEnum = {
  '10000': { code: '10000', name: '棋牌游戏', url: 'http://47.74.154.114/webadmin/public/admin/api/checkLoginAccess', desc: '这是棋牌游戏', imgurl: 'https://www.baidu.com/img/qixi_pad_d84d9e2020231e3c6b22aaec04296f1a.png' },
  '40000': { code: '40000', name: '电子游戏', url: 'http://47.74.154.114/tigergame/public/admin/api/checkLoginAccess', desc: '这是电子游戏', imgurl: 'https://www.baidu.com/img/qixi_pad_d84d9e2020231e3c6b22aaec04296f1a.png' },
  '30000': { code: '30000', name: '真人视讯', url: 'http://52.221.134.197:8080/gate/player/login', desc: '这是真人视讯', imgurl: 'https://www.baidu.com/img/qixi_pad_d84d9e2020231e3c6b22aaec04296f1a.png' }
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