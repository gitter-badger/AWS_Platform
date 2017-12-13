import { BizErr, Codes } from './Codes'
const Bluebird = require('bluebird')
const jwt = require('jsonwebtoken')
const jwtVerify = Bluebird.promisify(jwt.verify)
const TOKEN_SECRET = process.env.TOKEN_SECRET

// 返回模板
const responseTemplate = (statusCode, body, code, headers = {}) => {
  headers = {
    ...headers,
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Credentials': true
  }
  const content = {
    ...body,
    code: code
  }
  return { statusCode, headers, body: JSON.stringify(content) }
}
// 返回工具类
export const Success = (body, code = Codes.OK, headers = {}) => {
  return responseTemplate(200, body, code, headers)
}
export const Fail = (body, code = Codes.Error, headers = {}) => {
  return responseTemplate(500, body, code, headers)
}
export const ResOK = (callback, res) => callback(null, Success(res))
export const ResFail = (callback, res, code = Codes.Error) => callback(null, Fail(res, code))
export const ResErr = (callback, err) => ResFail(callback, { err: err }, err.code)

// 验证工具
export const JwtVerify = async (data) => {
  try {
    const decoded = await jwtVerify(data, TOKEN_SECRET)
    return [0, decoded]
  } catch (e) {
    return [BizErr.TokenErr(), 0]
  }
}
// 签名工具
export const JwtSign = (data) => {
  return jwt.sign(data, TOKEN_SECRET)
}

// 策略文档工具
export const GeneratePolicyDocument = (principalId, effect, resource, userInfo) => {
  var authResponse = {}
  authResponse.principalId = principalId
  authResponse.context = {}
  authResponse.context.username = userInfo.username
  authResponse.context.role = userInfo.role
  authResponse.context.userId = userInfo.userId
  authResponse.context.parent = userInfo.parent
  authResponse.context.suffix = userInfo.suffix
  authResponse.context.level = userInfo.level
  authResponse.context.displayName = userInfo.displayName
  authResponse.context.msn = userInfo.msn
  if (effect && resource) {
    var policyDocument = {}
    policyDocument.Version = '2012-10-17' // default version
    policyDocument.Statement = []
    var statementOne = {}
    statementOne.Action = 'execute-api:Invoke' // default action
    statementOne.Effect = effect;
    statementOne.Resource = resource;
    policyDocument.Statement[0] = statementOne
    authResponse.policyDocument = policyDocument
  }
  return authResponse
}
