import { Model } from './Dynamo'
// 线路号状态枚举
export const MSNStatusEnum = {
  Used: 1,
  Locked: 2,
  Free: 0
}

// 游戏类型枚举:正式环境
export const GameTypeEnum = {
  '10000': { code: '10000', name: '棋牌游戏', url: 'http://tablegame.na12345.com/admin/api/checkLoginAccess', desc: '网络棋牌游戏正在被大家慢慢接受和喜欢我们把传统的棋牌游戏进行重新定义加上全新的呈现技术灵活的运营模式，推出了NA棋牌的产品序列', imgurl: 'https://s3-ap-southeast-1.amazonaws.com/image-na-dev/2.png' },
  '40000': { code: '40000', name: '电子游戏', url: 'http://tigergame.na12345.com/admin/api/checkLoginAccess', desc: 'NA电子游戏融合了传统的经典电子游戏加入了更加多元化的题材以及更加具有娱乐性的玩法让更多的玩家有丰富的游戏体验', imgurl: 'https://s3-ap-southeast-1.amazonaws.com/image-na-dev/4.png' },
  '30000': { code: '30000', name: '真人视讯', url: 'http://lgate.na12345.com/gate/player/login', desc: '我们集合了当下最流行的真人视讯游戏类型整合了全新的互联网直播技术通过更逼真的赌场还原以及更流畅的服务，为客户提供全新的体验', imgurl: 'https://s3-ap-southeast-1.amazonaws.com/image-na-dev/1.png' }
}

//游戏类型枚举:开发环境
// export const GameTypeEnum = {
//   '10000': { code: '10000', name: '棋牌游戏', url: 'http://47.88.192.69/webadmin/public/admin/api/checkLoginAccess', desc: '网络棋牌游戏正在被大家慢慢接受和喜欢我们把传统的棋牌游戏进行重新定义加上全新的呈现技术灵活的运营模式，推出了NA棋牌的产品序列', imgurl: 'https://s3-ap-southeast-1.amazonaws.com/image-na-dev/2.png' },
//   '40000': { code: '40000', name: '电子游戏', url: 'http://47.88.192.69/tigergame/public/admin/api/checkLoginAccess', desc: 'NA电子游戏融合了传统的经典电子游戏加入了更加多元化的题材以及更加具有娱乐性的玩法让更多的玩家有丰富的游戏体验', imgurl: 'https://s3-ap-southeast-1.amazonaws.com/image-na-dev/4.png' },
//   '30000': { code: '30000', name: '真人视讯', url: 'http://103.5.4.246:48080/gate/player/login', desc: '我们集合了当下最流行的真人视讯游戏类型整合了全新的互联网直播技术通过更逼真的赌场还原以及更流畅的服务，为客户提供全新的体验', imgurl: 'https://s3-ap-southeast-1.amazonaws.com/image-na-dev/1.png' }
// }

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