import { ResOK, ResErr, JSONParser, BizErr, RoleCodeEnum, Model, Codes, S3Store$ } from './lib/all'
const AWS = require('aws-sdk')
const axios = require('axios')
const IMG_BUCKET = process.env.IMG_BUCKET
const redis = require('redis')
/**
 * 上传图片至S3
 */
const upload = async (e, c, cb) => {
    try {
        // 入参转换和校验
        const [jsonParseErr, inparam] = JSONParser(e && e.body)
        // 身份令牌
        const [tokenErr, token] = await Model.currentToken(e)
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
 * IP查询
 */
const ipquery = async (e, c, cb) => {
    try {
        // 请求IP查询
        axios.get('http://ip.taobao.com/service/getIpInfo.php?ip=' + (e.requestContext.identity.sourceIp || 'myip'))
            .then(function (res) {
                return ResOK(cb, { payload: res.data })
            })
            .catch(function (error) {
                return ResErr(cb, error)
            })
    } catch (error) {
        return ResErr(cb, error)
    }
}

const testredis = async (e, c, cb) => {
    try {
        redisClient = redis.createClient({ url: 'redis-19126.c1.ap-southeast-1-1.ec2.cloud.redislabs.com:19126' })
        redisClient.set('REDIS_TEST', 'REDIS存储测试', (err) => {
            if (err) throw err
            redisClient.get('REDIS_TEST', (err, value) => {
                ResOK(cb, { payload: value })
                redisClient.quit()
            })
        })
    } catch (error) {
        return ResErr(cb, error)
    }
}

/**
 * 对外方法
 */
export {
    upload,
    ipquery,
    testredis
}
