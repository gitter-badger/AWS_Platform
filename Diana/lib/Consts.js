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

const UserRole = function () {
  return {
    userId: Model.uuid(),
    username: Model.StringValue,
    password: Model.StringValue,
    passhash: Model.StringValue,
    parent: Model.StringValue,
    role: Model.StringValue
  }
}
const PlatformBaseBizRole = function () {
  return {
    ...UserRole(),
    displayId: Model.StringValue,
    displayName: Model.StringValue,
    suffix: Model.StringValue,
    limit: Model.NumberValue,
    children: Model.NumberValue,
    points: Model.NumberValue,
    rate: Model.NumberValue,
    gameList: [],
    parent: Model.StringValue,
    status: StatusEnum.Enable,
    remark: Model.StringValue,
    gender: GenderEnum.Male,
    lastIP: Model.StringValue,
    enabledAt: Model.timeStamp(),
    loginAt: Model.timeStamp()
  }
}
export const RoleEditProps = {
  '0': [],
  '1': [],
  '10': [
    'hostName',
    'hostContact',
    'rate',
    'limit',
    'gameList',
    'managerEmail',
    'remark',
    'adminName',
    'adminEmail',
    'adminContact',
    'contractPeriod'
  ],
  '100': [
    'hostName',
    'hostContact',
    'rate',
    'limit',
    'gameList',
    'managerEmail',
    'loginWhiteList',
    'frontURL',
    'remark',
    'adminName',
    'adminEmail',
    'adminContact',
    'contractPeriod'
  ],
  '1000': [],
  '10000': []

}
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
  ]
}

export const RoleModels = {
  '0': function () {
    return {
      ...UserRole(),
      parent: Model.NoParent,
      displayName: '超级管理员',
      loginAt: Model.timeStamp(),
      enabledAt: Model.timeStamp(),
      status: StatusEnum.Enable,
      suffix: 'NAPlay'
    }
  },
  '1': function () {
    return {
      ...UserRole(),
      parent: Model.NoParent,
      parentName: Model.NoParentName,
      displayName: '平台管理员',
      loginAt: Model.timeStamp(),
      enabledAt: Model.timeStamp(),
      status: StatusEnum.Enable,
      suffix: 'Platform',
      points: Model.PlatformAdminDefaultPoints,
      adminName: Model.StringValue,
      role: RoleCodeEnum['PlatformAdmin']
    }
  },
  '10': function () {
    return { // 建站代理商
      ...PlatformBaseBizRole(),
      managerName: Model.StringValue,
      managerEmail: Model.StringValue,
      hostName: Model.StringValue,
      hostContact: Model.StringValue,
      adminName: Model.StringValue,
      adminEmail: Model.StringValue,
      adminContact: Model.StringValue,
      contractPeriod: Model.StringValue,
      gmUsername: Model.StringValue,
      gmPassword: Model.StringValue,
      parent: Model.DefaultParent,
      parentName: Model.DefaultParentName
    }
  },
  '100': function () {
    return { // 商户
      ...PlatformBaseBizRole(),
      msn: Model.StringValue,
      apiKey: Model.uuid(),
      merchantName: Model.StringValue,
      merchantEmail: Model.StringValue,
      hostName: Model.StringValue,
      hostContact: Model.StringValue,
      adminName: Model.StringValue,
      adminEmail: Model.StringValue,
      adminContact: Model.StringValue,
      contractPeriod: Model.StringValue,
      frontURL: Model.StringValue,
      parent: Model.DefaultParent,
      parentName: Model.DefaultParentName,
      loginWhiteList: []
    }
  },
  '1000': function () {
    return {}
  },
  '10000': function () {
    return {}
  }
}
