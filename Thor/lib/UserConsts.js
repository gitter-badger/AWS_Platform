// ==================== 以下是全系统用户实体 ====================
import { Model } from './Dynamo'
// 性别枚举
export const GenderEnum = {
  Male: 1,
  Female: 0,
  Trans: 2
}
// 普通状态枚举
export const StatusEnum = {
  Enable: 1,
  Disable: 0
}
// 角色编码枚举
export const RoleCodeEnum = {
  'SuperAdmin': '0',
  'PlatformAdmin': '1',
  'Manager': '10',
  'Merchant': '100',
  'Agent': '1000',
  'Player': '10000'
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

    level: Model.NumberValue,             // 层级
    levelIndex: Model.StringValue,        // 层级索引

    lastIP: Model.StringValue,            // 最后IP
    loginAt: Model.timeStamp(),           // 登录时间
    enabledAt: Model.timeStamp(),         // 启用时间
    status: StatusEnum.Enable,            // 状态

    adminName: Model.StringValue,         // 管理帐号的管理员姓名
    adminEmail: Model.StringValue,        // 管理帐号的管理员邮箱
    adminContact: Model.StringValue       // 管理帐号的管理员联系方式
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
    remark: Model.StringValue,            // 备注
    gender: GenderEnum.Trans,             // 性别
    hostName: Model.StringValue,          // 负责人姓名
    hostContact: Model.StringValue        // 负责人联系方式
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
      gameList: [],                         // 游戏类型列表
      limit: Model.NumberValue,             // 可用名额
      managerEmail: Model.StringValue       // 线路商邮箱
    }
  },
  '100': function () {
    return { // 商户
      ...PlatformBaseBizRole(),
      gameList: [],                         // 游戏类型列表
      msn: Model.StringValue,               // 线路号
      apiKey: Model.uuid(),                 // APIKEY
      frontURL: Model.StringValue,          // 商户站点
      loginWhiteList: '0.0.0.0',            // 登录白名单
      merchantEmail: Model.StringValue,     // 商户邮箱
    }
  },
  '1000': function () {
    return {// 代理
      ...PlatformBaseBizRole(),
      vedioMix: Model.NumberValue,            // 电子游戏洗码比
      liveMix: Model.NumberValue,             // 真人视讯洗码比
      agentEmail: Model.StringValue           // 代理邮箱
    }
  },
  '10000': function () {
    return {}
  }
}
/**
 * 角色显示属性
 */
export const RoleDisplay = {
  '0': [],
  '1': [// 平台管理员
    'userId',
    'role',
    'suffix',
    'username',
    // 'password',
    'parent',
    'parentName',
    'displayName'
  ],
  '10': [// 线路商
    'userId',
    'role',
    'suffix',
    'username',
    // 'password',
    'parent',
    'parentName',
    'displayName',

    'displayId',        // 显示ID
    'contractPeriod',   // 有效期
    'isforever',        // 是否永久
    'updatedAt',        // 更新时间
    'remark'            // 备注
  ],
  '100': [// 商户
    'userId',
    'role',
    'suffix',
    'username',
    // 'password',
    'parent',
    'parentName',
    'displayName',

    'msn',            // 商户线路号
    'apiKey',         // 商户APIKEY

    'displayId',
    'contractPeriod',
    'isforever',
    'updatedAt',
    'remark'
  ],
  '1000': [// 代理
    'userId',
    'role',
    'suffix',
    'username',
    // 'password',
    'parent',
    'parentName',
    'displayName',

    'vedioMix',       // 电子游戏洗码比
    'liveMix',        // 真人视讯洗码比

    'displayId',
    'contractPeriod',
    'isforever',
    'updatedAt',
    'remark'
  ]
}
/**
 * 角色可修改属性
 */
export const RoleEditProps = {
  '0': [],
  '1': [],
  '10': [// 线路商
    'hostName',
    'hostContact',
    'managerEmail',
    'adminName',
    'adminEmail',
    'adminContact',
    'password',
    'rate',
    'gameList',

    'limit',          // 线路商可用名额

    'contractPeriod',
    'isforever',
    'remark'
  ],
  '100': [// 商户
    'hostName',
    'hostContact',
    'merchantEmail',
    'adminName',
    'adminEmail',
    'adminContact',
    'password',
    'rate',
    'gameList',

    'loginWhiteList', // 商户白名单
    'frontURL',       // 商户前端URL

    'contractPeriod',
    'remark',
    'isforever'
  ],
  '1000': [// 代理
    'hostName',
    'hostContact',
    'agentEmail',
    'password',
    'rate',
    'contractPeriod',
    'isforever',

    'vedioMix',     // 电子游戏洗码比
    'liveMix',      // 真人视讯洗码比
    'remark'
  ],
  '10000': []
}