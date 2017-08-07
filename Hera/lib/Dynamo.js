import AWS from 'aws-sdk'
import { Stream$ } from './Rx5'
import { CHeraErr, CODES } from './Codes'
import { JwtVerify,JwtSign } from './Response'
const bcrypt = require('bcryptjs')
const uid = require('uuid/v4')
const generatePassword = require('password-generator')
AWS.config.update({region: 'ap-southeast-1'})
AWS.config.setPromisesDependency(require('bluebird'))

const dbClient = new AWS.DynamoDB.DocumentClient()
const db$ = (action,params)=>{
  return dbClient[action](params).promise()
}

// table names
const ZeusPlatformUser = 'ZeusPlatformUser'
const ZeusPlatformRole = 'ZeusPlatformRole'
const ZeusPlatformPlayer = 'ZeusPlatformPlayer'
const ZeusPlatformBill = 'ZeusPlatformBill'
const ZeusPlatformGame = 'ZeusPlatformGame'
const ZeusPlatformMSN = 'ZeusPlatformMSN'

export const Tables = {
  ZeusPlatformUser,
  ZeusPlatformRole,
  ZeusPlatformPlayer,
  ZeusPlatformBill,
  ZeusPlatformGame,
  ZeusPlatformMSN
}



export const Model = {
  USERNAME_LIMIT: [6,16], // 用户名长度限制
  PASSWORD_PATTERN: [3,16],
  StringValue: 'NULL!',
  NumberValue: 0.0,
  DefaultParent: '01', // 平台
  DefaultParentName: 'PlatformAdmin',
  NoParent: '00', // 没有
  NoParentName:'SuperAdmin',
  usn: () => (new Date()).getTime() % 1000000 + 100000,
  uuid: () => uid(),
  displayId: () => (new Date()).getTime() % 1000000 + 100000,
  timeStamp: () => (new Date()).getTime(),
  currentToken: async (e) =>{
    e.headers = e.headers || {};
    e.headers.Authorization = e.headers.Authorization;
    e.requestContext = e.requestContext || {};
    if (!e || (!e.requestContext.authorizer && !e.headers.Authorization)) {
      return [new CHeraErr(CODES.TokenError),0]
    }
    if(!e.headers.Authorization) {
      return [0, e.requestContext.authorizer]
    }else {
      console.log("111111111111111111111111");
      return [0,e.headers.Authorization.split(" ")]
    }
  },
  token: (userInfo)=>{
    return JwtSign({
      ...userInfo,
      iat: Math.floor(Date.now() / 1000) - 30
    })
  },
  baseModel: function(){ // the db base model
    return {
      createdAt: (new Date()).getTime(),
      updatedAt: (new Date()).getTime()
    }
  },
  hashGen: (pass) => {
    return bcrypt.hashSync(pass,10)
  },
  hashValidate: async(pass,hash) =>{
    const result = await bcrypt.compare(pass,hash)
    return result
  },
  sourceIP: (e) =>{
    return e && e.requestContext.identity.sourceIp
  },
  pathParams:(e)=>{
    try {
      const params = e.pathParameters
      if (Object.keys(params).length) {
        return [0,params]
      }
    } catch (err) {
        return [BizErr.ParamErr(err.toString()),0]
    }
  },
  genPassword:() => {
    return generatePassword()
  },
  addSourceIP: (e,info)=>{
    const sourceIP = e && e.requestContext && e.requestContext.identity.sourceIp || '-100'
    return {
      ...info,
      lastIP:sourceIP
    }
  }
}
