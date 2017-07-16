import AWS from 'aws-sdk'
import { Stream$ } from './Rx5'
import { BizErr } from './Codes'
const bcrypt = require('bcryptjs')
const uid = require('uuid/v4')

AWS.config.update({region: 'ap-southeast-1'})
AWS.config.setPromisesDependency(require('bluebird'))

const dbClient = new AWS.DynamoDB.DocumentClient()
const db$ = (action,params)=>{
  return dbClient[action](params).promise()
}
export const Store$ = async(action,params) =>{
  console.log(params);
  try{
    const result = await db$(action,params)
    return [0,result]
  }catch(e){
    return [BizErr.DBErr(e.toString()),0]
  }
}

// table names
const ZeusPlatformUser = 'ZeusPlatformUser'
const ZeusPlatformRole = 'ZeusPlatformRole'
const ZeusPlatformPlayer = 'ZeusPlatformPlayer'
const ZeusPlatformBill = 'ZeusPlatformBill'
const ZeusPlatformGame = 'ZeusPlatformGame'

export const Tables = {
  ZeusPlatformUser,
  ZeusPlatformRole,
  ZeusPlatformPlayer,
  ZeusPlatformBill,
  ZeusPlatformGame
}



export const Model = {
  USERNAME_LIMIT: [6,16], // 用户名长度限制
  PASSWORD_PATTERN: [3,16],
  StringValue: '0',
  NumberValue: 0.0,
  DefaultParent: '01', // 平台
  NoParent: '00', // 没有
  usn: () => (new Date()).getTime() % 1000000 + 100000,
  uuid: () => uid(),
  displayId: () => (new Date()).getTime() % 1000000 + 100000,
  timeStamp: () => (new Date()).getTime(),
  currentToken: async (e) =>{
    const token = e && e.headers.Authorization &&  e.headers.Authorization.split(' ') || ''
    if (token[0] === 'Bearer' && token[1]) {
      return [0,{
        userId:token[1]
      }]
    }
    return [BizErr.TokenErr(),0]
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
    return e && e.pathParameters || {}
  },
  addSourceIP: (e,info)=>{
    const sourceIP = e && e.requestContext && e.requestContext.identity.sourceIp || '-100'
    return {
      ...info,
      lastIP:sourceIP
    }
  }
}
