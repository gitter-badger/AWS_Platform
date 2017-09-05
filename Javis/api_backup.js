import { ResOK, ResFail, ResErr, JSONParser, BizErr, RoleCodeEnum, Model, Codes, Pick } from './lib/all'
import { UserModel } from './model/UserModel'

let DynamoBackup = require('dynamo-backup-to-s3')

/**
 * 备份所有数据表
 */
const backup = async (e, c, cb) => {
    try {
        const res = { m: 'organize' }
        // 入参转换和校验
        const [jsonParseErr, inparam] = JSONParser(e && e.body)
        // 身份令牌
        const [tokenErr, token] = await Model.currentToken(e)
        // 初始化备份对象
        let backup = new DynamoBackup({
            bucket: 'backup-na',
            excludedTables: ['ZeusPlatformLog','HeraGameRecord','ZeusPlatformBill','HeraGamePlayerBill','HeraGameDiamondBill'],
            stopOnFailure: true,
            base64Binary: false,
            awsAccessKey: 'AKIAJYJECZFXONHF7OEA',
            awsSecretKey: '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',
            awsRegion: 'ap-southeast-1'
        })
        backup.on('error', function (data) {
            console.error('备份发生错误：' + data.table)
            console.error(data.err)
        })
        backup.on('start-backup', function (tableName, startTime) {
            console.log('开始备份表： ' + tableName)
        })
        backup.on('end-backup', function (tableName, backupDuration) {
            console.log('结束备份表：' + tableName)
        })
        backup.backupAllTables(function () {
            console.log('备份结束！')
        })
        // 结果返回
        return ResOK(cb, { ...res, payload: {} })
    } catch (error) {
        return ResErr(cb, error)
    }
}

// ==================== 以下为内部方法 ====================

export {
    backup                     // 组织架构
}
