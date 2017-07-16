import { GenderEnum, StatusEnum } from '../lib/all'
export const Manager = {
  rank: '1', // 列表序号
  parent: 'NA泛娱乐', // 父级线路代理商
  pk:'100000', // 代理商ID
  suffix: 'NA', // 代理标示
  rate: '90', // 代理成数
  limit: 100000, // 代理下线限制
  subs: 500,// 代理已有下线
  points: 10000.0, // 代理点数
  gameList: ['g1','g2','g3'], // 游戏列表
  createdAt: 1498997323135, //创建时间
  loginAt: 1498997323135, // 最后登录时间
  enabledAt: 1498997323135, // 代理最后启用时间
  lastIP: '128.22.22.22',
  status: StatusEnum.Online, // 当前状态
  gender: GenderEnum.Male, // 性别
  nick: 'Faker', // 昵称 不能为空
  managerName:'孙悟空', // 代理商姓名
  managerEmail: 'faker@gmail.com', // 代理联系邮箱
  hostName:'八戒', //负责人姓名
  hostContact:'86135000000', // 负责人联系方式
  adminName:'唐僧', // 代理商管理员姓名
  adminEmail: 'fakerAdmin@gmail.com', // 代理管理员联系邮箱
  adminContact: '86136000000', // 代理管理员
  remark: '这是一个Benji', // 备注
  adminUsername: 'FakerAdmin', // 代理管理员账号
  gmUsername: 'gmFaker', // 代理商游戏管理员账号
  contractPeriod: '1498997323135:1498997341022' //合同生效时间
}
