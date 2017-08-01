import AWS from 'aws-sdk'
import { Stream$ } from './Rx5'
import { BizErr } from './Codes'
import { JwtVerify, JwtSign } from './Response'
const bcrypt = require('bcryptjs')
const uid = require('uuid/v4')
const generatePassword = require('password-generator')
AWS.config.update({ region: 'ap-southeast-1' })
AWS.config.setPromisesDependency(require('bluebird'))

// 数据库封装
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

// 所有数据库表
const ZeusPlatformUser = 'ZeusPlatformUser'
const ZeusPlatformBill = 'ZeusPlatformBill'
const ZeusPlatformMSN = 'ZeusPlatformMSN'
const ZeusPlatformCaptcha = 'ZeusPlatformCaptcha'
const ZeusPlatformLog = 'ZeusPlatformLog'
const ZeusPlatformCode = 'ZeusPlatformCode'

const DianaPlatformGame = 'DianaPlatformGame'
const DianaPlatformCompany = 'DianaPlatformCompany'
const DianaPlatformTool = 'DianaPlatformTool'

export const Tables = {
  ZeusPlatformUser,
  ZeusPlatformBill,
  ZeusPlatformMSN,
  ZeusPlatformCaptcha,
  ZeusPlatformLog,
  ZeusPlatformCode,

  DianaPlatformGame,
  DianaPlatformCompany,
  DianaPlatformTool
}

/**
 * 基础Model
 */
export const Model = {
  StringValue: '0',
  NumberValue: 0.0,
  PlatformAdminDefaultPoints: 100000000.00,
  DefaultParent: '01', // 平台
  DefaultParentName: 'PlatformAdmin',
  NoParent: '00', // 没有
  NoParentName: 'SuperAdmin',
  /**
   * 生成唯一编号
   */
  uucode: async (type, size) => {
    const ret = await db$('query', {
      TableName: Tables.ZeusPlatformCode,
      KeyConditionExpression: '#type = :type',
      ExpressionAttributeNames: {
        '#type': 'type'
      },
      ExpressionAttributeValues: {
        ':type': type,
      }
    })
    // 所有编号都被占用
    if (ret.Items.length >= Math.pow(10, size) - Math.pow(10, size - 1)) {
      return [BizErr.CodeFullError(), 0]
    }
    // 所有占用编号组成数组
    let codeArr = new Array()
    for (let item of ret.Items) {
      codeArr.push(parseInt(item.code))
    }
    // 获取指定位数的随机数
    let randomCode = Math.floor((Math.random() + Math.floor(Math.random() * 9 + 1)) * Math.pow(10, size - 1))
    // 判断随机线路号是否已被占用
    while (codeArr.indexOf(randomCode) != -1) {
      randomCode = Math.floor((Math.random() + Math.floor(Math.random() * 9 + 1)) * Math.pow(10, size - 1))
    }
    // 编号插入
    // await db$('put', {
    //   TableName: Tables.ZeusPlatformCode,
    //   Item: {
    //     type: type,
    //     code: randomCode.toString()
    //   }
    // })
    // 返回编号
    return [0, randomCode.toString()]
  },
  uuid: () => uid(),
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
