import { ResOK, ResErr, Codes, JSONParser, Model, Tables, RoleCodeEnum, BizErr } from './lib/all'

// 七牛上传工具
const qiniu = require('qiniu')
const QINIU_ACCESS_KEY = 'J-aTOnu1qNxJgP5Sm9HsvksPXZ4URjD8nVhEjRmr'
const QINIU_SECRET_KEY = 'sC7cw2O0hEVVPfhwHjE5A8C4F-7rvq_kpmjxxaIc'
const QINIU_BUCKET = 'rotta-file'

/**
 * 七牛云TOKEN
 */
const upToken = async (e, c, cb) => {
  try {
    // 入参转换
    const [jsonParseErr, inparam] = JSONParser(e && e.body)
    // 身份令牌
    const [tokenErr, token] = await Model.currentToken(e)
    // 业务操作
    const mac = new qiniu.auth.digest.Mac(QINIU_ACCESS_KEY, QINIU_SECRET_KEY)
    const options = { scope: QINIU_BUCKET + ':' + inparam.fileKey }
    const putPolicy = new qiniu.rs.PutPolicy(options)
    const upToken = putPolicy.uploadToken(mac)
    return ResOK(cb, { payload: upToken })
  } catch (error) {
    return ResErr(cb, error)
  }
}

// ==================== 以下为内部方法 ====================

export {
  upToken                     // 七牛云上传token
}