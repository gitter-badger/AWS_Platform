import AWS from 'aws-sdk'
import { Stream$ } from './Rx5'
import { BizErr } from './Codes'
import { JwtVerify, JwtSign } from './Response'
const bcrypt = require('bcryptjs')
const uid = require('uuid/v4')
const generatePassword = require('password-generator')
AWS.config.update({ region: 'ap-southeast-1' })
AWS.config.setPromisesDependency(require('bluebird'))

const dbClient = new AWS.DynamoDB.DocumentClient()
const db$ = (action, params) => {
  return dbClient[action](params).promise()
}
export const Store$ = async (action, params) => {
  console.log(action, params);
  try {
    const result = await db$(action, params)
    return [0, result]
  } catch (e) {
    return [BizErr.DBErr(e.toString()), 0]
  }
}

// table names
const ZeusPlatformUser = 'ZeusPlatformUser'
const ZeusPlatformRole = 'ZeusPlatformRole'
const ZeusPlatformPlayer = 'ZeusPlatformPlayer'
const ZeusPlatformBill = 'ZeusPlatformBill'
const ZeusPlatformCompany = 'ZeusPlatformCompany'
const ZeusPlatformGame = 'ZeusPlatformGame'
const ZeusPlatformMSN = 'ZeusPlatformMSN'
const ZeusPlatformCaptcha = 'ZeusPlatformCaptcha'
const ZeusPlatformLog = 'ZeusPlatformLog'

export const Tables = {
  ZeusPlatformUser,
  ZeusPlatformRole,
  ZeusPlatformPlayer,
  ZeusPlatformBill,
  ZeusPlatformCompany,
  ZeusPlatformGame,
  ZeusPlatformMSN,
  ZeusPlatformCaptcha,
  ZeusPlatformLog
}

export const Model = {
  USERNAME_LIMIT: [6, 16], // 用户名长度限制
  PASSWORD_PATTERN: [3, 16],
  StringValue: '0',
  NumberValue: 0.0,
  PlatformAdminDefaultPoints: 100000000.00,
  DefaultParent: '01', // 平台
  DefaultParentName: 'PlatformAdmin',
  NoParent: '00', // 没有
  NoParentName: 'SuperAdmin',
  usn: () => (new Date()).getTime() % 1000000 + 100000,
  uuid: () => uid(),
  displayId: () => (new Date()).getTime() % 1000000 + 100000,
  timeStamp: () => (new Date()).getTime(),
  currentToken: async (e) => {
    if (!e || !e.requestContext.authorizer) {
      return [BizErr.TokenErr(), 0]
    }
    return [0, e.requestContext.authorizer]
  },
  currentRoleToken: async (e, roleCode) => {
    if (!e || !e.requestContext.authorizer) {
      return [BizErr.TokenErr(), 0]
    } else {
      if (e.requestContext.authorizer.role != roleCode) {
        return [BizErr.RoleTokenErr(), 0]
      }
    }
    return [0, e.requestContext.authorizer]
  },
  token: (userInfo) => {
    return JwtSign({
      ...userInfo,
      iat: Math.floor(Date.now() / 1000) - 30
    })
  },
  baseModel: function () { // the db base model
    return {
      createdAt: (new Date()).getTime(),
      updatedAt: (new Date()).getTime()
    }
  },
  hashGen: (pass) => {
    return bcrypt.hashSync(pass, 10)
  },
  hashValidate: async (pass, hash) => {
    const result = await bcrypt.compare(pass, hash)
    return result
  },
  sourceIP: (e) => {
    return e && e.requestContext.identity.sourceIp
  },
  pathParams: (e) => {
    try {
      const params = e.pathParameters
      if (Object.keys(params).length) {
        return [0, params]
      }
    } catch (err) {
      return [BizErr.ParamErr(err.toString()), 0]
    }
  },
  genPassword: () => {
    return generatePassword()
  },
  addSourceIP: (e, info) => {
    const sourceIP = e && e.requestContext && e.requestContext.identity.sourceIp || '-100'
    return {
      ...info,
      lastIP: sourceIP
    }
  }
}
