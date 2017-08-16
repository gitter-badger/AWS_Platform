import { Model } from './Dynamo'

export const GenderEnum = {
  Male: 1,
  Female: 0,
  Trans: 2
}
export const StatusEnum = {
  Enable: 1,
  Disable: 0
}
export const GameStatusEnum = {
  Online: 1,
  Offline: 2,
  Maintain: 3,
  Error: 4,
  Delete: 0
}
export const CompanyStatusEnum = {
  Enable: 1,
  Disable: 0
}
export const ToolStatusEnum = {
  Enable: 1,
  Disable: 0,
  PROMOTOPN: 2
}
export const PackageStatusEnum = {
  Enable: 1,
  Disable: 0,
  PROMOTOPN: 2
}
export const RoleCodeEnum = {
  'SuperAdmin': '0',
  'PlatformAdmin': '1',
  'Manager': '10',
  'Merchant': '100',
  'Agent': '1000',
  'Player': '10000'
}
export const GameTypeEnum = {
  '10000': { code: '10000', name: '棋牌游戏', url: 'http://192.168.3.131/webadmin/public/admin/api/checkLoginAccess' },
  '40000': { code: '40000', name: '电子游戏', url: 'http://test.com' },
  '30000': { code: '30000', name: '真人视讯', url: 'http://146.88.71.30:8011/player/login' }
}
export const BillMo = function () {
  return {
    sn: Model.uuid(),
    fromRole: Model.StringValue,
    toRole: Model.StringValue,
    fromUser: Model.StringValue,
    toUser: Model.StringValue,
    action: Model.NumberValue,
    amount: Model.NumberValue,
    operator: Model.StringValue,
    remark: Model.StringValue
  }
}

/**
 * 角色基类
 */
const UserRole = function () {
  return {
    role: Model.StringValue,              // 角色
    userId: Model.uuid(),                 // 用户ID
    username: Model.StringValue,          // 完整账号名
    uname: Model.StringValue,             // 帐号名
    password: Model.StringValue,          // 密码
    passhash: Model.StringValue,          // 密码hash
    parent: Model.NoParent,               // 默认没有上级

    lastIP: Model.StringValue,            // 最后IP
    loginAt: Model.timeStamp(),           // 登录时间
    enabledAt: Model.timeStamp(),         // 启用时间
    status: StatusEnum.Enable,            // 状态
  }
}
/**
 * 平台角色基类
 */
const PlatformBaseBizRole = function () {
  return {
    ...UserRole(),
    parent: Model.DefaultParent,          // 默认上级平台
    parentName: Model.DefaultParentName,  // 默认上级平台名称
    displayId: Model.NumberValue,         // 显示ID
    displayName: Model.StringValue,       // 显示名称
    suffix: Model.StringValue,            // 前缀
    children: Model.NumberValue,
    points: Model.NumberValue,            // 初始积分
    rate: Model.NumberValue,              // 抽成比
    isforever: false,                     // 是否永久
    contractPeriod: Model.StringValue,    // 有效期
    gameList: [],                         // 游戏类型列表
    remark: Model.StringValue,            // 备注
    gender: GenderEnum.Trans,             // 性别
    hostName: Model.StringValue,          // 负责人姓名
    hostContact: Model.StringValue,       // 负责人联系方式
    adminName: Model.StringValue,         // 管理帐号的管理员姓名
    adminEmail: Model.StringValue,        // 管理帐号的管理员邮箱
    adminContact: Model.StringValue       // 管理帐号的管理员联系方式

  }
}
/**
 * 角色实体
 */
export const RoleModels = {
  '0': function () {
    return {
      ...UserRole(),
      parentName: Model.NoParentName,
      role: RoleCodeEnum['SuperAdmin'],
      displayName: '超级管理员',
      suffix: 'NAPlay'
    }
  },
  '1': function () {
    return {
      ...UserRole(),
      parentName: Model.NoParentName,
      role: RoleCodeEnum['PlatformAdmin'],
      displayName: '平台管理员',
      suffix: 'Platform',
      points: Model.PlatformAdminDefaultPoints
    }
  },
  '10': function () {
    return { // 线路商
      ...PlatformBaseBizRole(),
      managerEmail: Model.StringValue,      // 线路商邮箱
      limit: Model.NumberValue,             // 可用名额
      // gmUsername: Model.StringValue,
      // gmPassword: Model.StringValue,
    }
  },
  '100': function () {
    return { // 商户
      ...PlatformBaseBizRole(),
      msn: Model.StringValue,               // 线路号
      apiKey: Model.uuid(),                 // APIKEY
      merchantEmail: Model.StringValue,     // 商户邮箱
      frontURL: Model.StringValue,          // 商户站点
      loginWhiteList: '0.0.0.0'             // 登录白名单
    }
  },
  '1000': function () {
    return {// 代理
      ...PlatformBaseBizRole(),
      suffix: 'AGENT',                      // 前缀
      apiKey: Model.uuid(),                 // APIKEY
      agentEmail: Model.StringValue,        // 代理邮箱
      loginWhiteList: '0.0.0.0'             // 登录白名单
    }
  },
  '10000': function () {
    return {}
  }
}
/**
 * 角色可修改属性
 */
export const RoleEditProps = {
  '0': [],
  '1': [],
  '10': [
    'hostName',
    'hostContact',
    'password',
    'rate',
    'limit',
    'gameList',
    'managerEmail',
    'adminName',
    'adminEmail',
    'adminContact',
    'contractPeriod',
    'remark',
    'isforever'
  ],
  '100': [
    'hostName',
    'hostContact',
    'password',
    'rate',
    'limit',
    'gameList',
    'loginWhiteList',
    'frontURL',
    'merchantEmail',
    'adminName',
    'adminEmail',
    'adminContact',
    'contractPeriod',
    'remark',
    'isforever'
  ],
  '1000': [
    'hostName',
    'hostContact',
    'password',
    'rate',
    'gameList',
    'loginWhiteList',
    'agentEmail',
    'adminName',
    'adminEmail',
    'adminContact',
    'contractPeriod',
    'remark',
    'isforever'
  ],
  '10000': []
}
/**
 * 角色显示属性
 */
export const RoleDisplay = {
  '0': [],
  '1': [
    'username',
    'password',
    'suffix',
    'parent',
    'parentName',
    'userId',
    'role',
    'displayName'
  ],
  '10': [
    'username',
    'password',
    'suffix',
    'parent',
    'parentName',
    'userId',
    'role',
    'displayName',
    'updatedAt',
    'displayId'
  ],
  '100': [
    'username',
    'password',
    'msn',
    'suffix',
    'parent',
    'parentName',
    'userId',
    'role',
    'displayName',
    'apiKey',
    'displayId',
    'updatedAt'
  ],
  '1000': [
    'username',
    'password',
    'suffix',
    'parent',
    'parentName',
    'userId',
    'role',
    'displayName',
    'apiKey',
    'displayId',
    'updatedAt'
  ]
}

