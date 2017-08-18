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
// 游戏类型枚举
export const GameTypeEnum = {
  '10000': { code: '10000', name: '棋牌游戏', url: 'http://192.168.3.131/webadmin/public/admin/api/checkLoginAccess' },
  '40000': { code: '40000', name: '电子游戏', url: 'http://test.com' },
  '30000': { code: '30000', name: '真人视讯', url: 'http://146.88.71.30:8011/player/login' }
}