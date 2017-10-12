import { ResOK, ResErr, JSONParser, BizErr, RoleCodeEnum, Model, Codes, Pick, S3Store$ } from './lib/all'
const AWS = require('aws-sdk')
const IMG_BUCKET = process.env.IMG_BUCKET

/**
 * 上传图片至S3
 */
const upload = async (e, c, cb) => {
    try {
        // 入参转换和校验
        const [jsonParseErr, inparam] = JSONParser(e && e.body)
        // 身份令牌
        // const [tokenErr, token] = await Model.currentToken(e)
        if (!inparam.contentType) {
            return ResErr(cb, BizErr.InparamErr('Missing contentType'))
        }
        if (!inparam.filePath) {
            return ResErr(cb, BizErr.InparamErr('Missing filePath'))
        }
        const params = {
            Bucket: IMG_BUCKET,
            Key: inparam.filePath,
            Expires: 3600,
            ContentType: inparam.contentType
        }
        new AWS.S3().getSignedUrl('putObject', params, (err, url) => {
            if (err) {
                return ResErr(cb, BizErr.InparamErr(err.message))
            } else {
                return ResOK(cb, { payload: url })
            }
        })
    } catch (error) {
        return ResErr(cb, error)
    }
}

/**
 * 对外方法
 */
export {
    upload
}
