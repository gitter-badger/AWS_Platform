import {
  Success,
  Fail,
  Codes,
  JSONParser,
  Model,
  Tables,
  GameTypeEnum,
  StatusEnum,
  GenderEnum,
  RoleCodeEnum,
  RoleEditProps,
  Trim,
  Pick,
  JwtVerify,
  GeneratePolicyDocument,
  BizErr
} from './lib/all'

// 七牛上传工具
const qiniu = require('qiniu')
const QINIU_ACCESS_KEY = 'J-aTOnu1qNxJgP5Sm9HsvksPXZ4URjD8nVhEjRmr'
const QINIU_SECRET_KEY = 'sC7cw2O0hEVVPfhwHjE5A8C4F-7rvq_kpmjxxaIc'
const QINIU_BUCKET = 'rotta-file'

const ResOK = (callback, res) => callback(null, Success(res))
const ResFail = (callback, res, code = Codes.Error) => callback(null, Fail(res, code))
const ResErr = (callback, err) => ResFail(callback, { err: err }, err.code)

/**
 * 七牛云TOKEN
 */
const upToken = async (e, c, cb) => {
  const res = { m: 'upToken' }
  // 入参转换和校验
  const [jsonParseErr, inparam] = JSONParser(e && e.body)
  if (jsonParseErr) {
    return ResErr(cb, jsonParseErr)
  }
  // 身份令牌
  const [tokenErr, token] = await Model.currentToken(e)
  if (tokenErr) {
    return ResErr(cb, tokenErr)
  }
  const mac = new qiniu.auth.digest.Mac(QINIU_ACCESS_KEY, QINIU_SECRET_KEY)
  const options = { scope: QINIU_BUCKET + ':' + inparam.fileKey }
  const putPolicy = new qiniu.rs.PutPolicy(options)
  const upToken = putPolicy.uploadToken(mac)
  return ResOK(cb, { ...res, payload: upToken })
}

// ==================== 以下为内部方法 ====================

/**
  api export
**/
export {
  upToken                     // 七牛云上传token
}