import AWS from 'aws-sdk'
import { CHeraErr, CODES } from './Codes'
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

// table names
const ZeusPlatformUser = 'ZeusPlatformUser'
const ZeusPlatformRole = 'ZeusPlatformRole'
const HeraGamePlayer = 'HeraGamePlayer'
const ZeusPlatformBill = 'ZeusPlatformBill'
const ZeusPlatformGame = 'DianaPlatformGame'
const ZeusPlatformMSN = 'ZeusPlatformMSN'
const HawkeyeGameNotice = 'HawkeyeGameNotice'
const DianaPlatformTool = 'DianaPlatformTool'
const HawkeyeGameEmail = 'HawkeyeGameEmail'
const HeraGameDiamondBill = 'HeraGameDiamondBill'
const HawkeyePlayerEmailRecord = "HawkeyePlayerEmailRecord"
const HulkPlatformAd = "HulkPlatformAd"
const SYSConfig = "SYSConfig"
const UserRankStat = 'UserRankStat'

export const Tables = {
  ZeusPlatformUser,
  HeraGameDiamondBill,
  ZeusPlatformRole,
  HeraGamePlayer,
  ZeusPlatformBill,
  ZeusPlatformGame,
  ZeusPlatformMSN,
  HawkeyeGameNotice,
  DianaPlatformTool,
  HawkeyeGameEmail,
  HawkeyePlayerEmailRecord,
  HulkPlatformAd,
  SYSConfig,
  UserRankStat
}



export const Model = {
  StringValue: 'NULL!',
  USERNAME_LIMIT: [6, 16], // 用户名长度限制
  PASSWORD_PATTERN: [3, 16],
  StringValue: 'NULL!',
  NumberValue: 0.0,
  DefaultParent: '01', // 平台
  DefaultParentName: 'PlatformAdmin',
  NoParent: '00', // 没有
  NoParentName: 'SuperAdmin',
  usn: () => (new Date()).getTime() % 1000000 + 100000,
  uuid: () => uid(),
  displayId: () => (new Date()).getTime() % 1000000 + 100000,
  timeStamp: () => (new Date()).getTime(),
  currentToken: async (e) => {
    e.headers = e.headers || {};
    e.headers.Authorization = e.headers.Authorization;
    e.requestContext = e.requestContext || {};
    if (!e || (!e.requestContext.authorizer && !e.headers.Authorization)) {
      return [new CHeraErr(CODES.TokenError), 0]
    }
    if (e.requestContext.authorizer.principalId == -1) {
      throw BizErr.TokenExpire()
    }
    if (!e.headers.Authorization) {
      return [0, e.requestContext.authorizer]
    } else {
      return [0, e.headers.Authorization.split(" ")]
    }
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
      updatedAt: (new Date()).getTime(),
      createdDate: new Date().Format("yyyy-MM-dd")
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
// 私有日期格式化方法
Date.prototype.Format = function (fmt) {
  var o = {
    "M+": this.getMonth() + 1, //月份 
    "d+": this.getDate(), //日 
    "h+": this.getHours(), //小时 
    "m+": this.getMinutes(), //分 
    "s+": this.getSeconds(), //秒 
    "q+": Math.floor((this.getMonth() + 3) / 3), //季度 
    "S": this.getMilliseconds() //毫秒 
  };
  if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
  for (var k in o)
    if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
  return fmt;
}
