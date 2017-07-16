import { BizErr,Codes } from './Codes'
import { TOKEN_SECRET } from './secret/TokenSecret'
const Bluebird = require('bluebird')
const jwtVerify = Bluebird.promisify(require('jsonwebtoken').verify)

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
  return {statusCode, headers, body: JSON.stringify(content)}
}
// Response utils

export const Success = (body, code = Codes.OK, headers = {}) => {
  return responseTemplate(200, body, code, headers)
}
export const Fail = (body, code = Codes.Error, headers = {}) => {
  return responseTemplate(500, body, code, headers)
}

export const JwtVerify = async (data) => {
  try {
    const decoded = await jwtVerify(data,TOKEN_SECRET)
    return [0,decoded]
  } catch (e) {
    return [BizErr.TokenErr(),0]
  }
}
