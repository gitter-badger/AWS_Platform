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
  '10000': { code: '10000', name: '棋牌游戏', url: 'http://root.rottagame.com/admin/api/checkLoginAccess', desc: '这是棋牌游戏', imgurl: 'https://www.baidu.com/img/qixi_pad_d84d9e2020231e3c6b22aaec04296f1a.png' },
  '40000': { code: '40000', name: '电子游戏', url: 'http://47.88.192.69/tigergame/public/admin/api/checkLoginAccess', desc: '这是电子游戏', imgurl: 'https://www.baidu.com/img/qixi_pad_d84d9e2020231e3c6b22aaec04296f1a.png' },
  '30000': { code: '30000', name: '真人视讯', url: 'http://52.221.134.197:8080/player/login', desc: '这是真人视讯', imgurl: 'https://www.baidu.com/img/qixi_pad_d84d9e2020231e3c6b22aaec04296f1a.png' }
}