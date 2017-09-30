import { Model } from './Dynamo'
// 游戏状态枚举
export const GameStatusEnum = {
  Online: 1,
  Offline: 2,
  Maintain: 3,
  Error: 4,
  Delete: 0
}
// 游戏厂商状态枚举
export const CompanyStatusEnum = {
  Enable: 1,
  Disable: 0
}
// 配置状态枚举
export const ConfigStatusEnum = {
  Enable: 1,
  Disable: 0
}
// 游戏类型枚举
export const GameTypeEnum = {
  '10000': { code: '10000', name: '棋牌游戏', url: 'http://tablegame.na12345.com/admin/api/checkLoginAccess', desc: '网络棋牌游戏正在被大家慢慢接受和喜欢我们把传统的棋牌游戏进行重新定义加上全新的呈现技术灵活的运营模式，推出了NA棋牌的产品序列', imgurl: 'http://ouef62ous.bkt.clouddn.com/2.png' },
  '40000': { code: '40000', name: '电子游戏', url: 'http://tigergame.na12345.com/admin/api/checkLoginAccess', desc: 'NA电子游戏融合了传统的经典电子游戏加入了更加多元化的题材以及更加具有娱乐性的玩法让更多的玩家有丰富的游戏体验', imgurl: 'http://ouef62ous.bkt.clouddn.com/4.png' },
  '30000': { code: '30000', name: '真人视讯', url: 'http://52.221.134.197:8080/gate/player/login', desc: '我们集合了当下最流行的真人视讯游戏类型整合了全新的互联网直播技术通过更逼真的赌场还原以及更流畅的服务，为客户提供全新的体验', imgurl: 'http://ouef62ous.bkt.clouddn.com/1.png' }
}