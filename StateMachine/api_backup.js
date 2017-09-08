import { ResOK, ResErr, JSONParser, BizErr, RoleCodeEnum, Model, Codes, Pick } from './lib/all'

let DynamoBackup = require('dynamo-backup-to-s3')

/**
 * 备份所有数据表
 */
const backup = async (e, c, cb) => {
    try {
        const res = { m: 'backup' }
        // 入参转换和校验
        const [jsonParseErr, inparam] = JSONParser(e && e.body)
        // 身份令牌
        const [tokenErr, token] = await Model.currentToken(e)
        // 开始备份
        const [backupErr, backupRet] = await doBackup()
        if (backupErr) { return ResErr(cb, backupErr) }
        // 结果返回
        console.info(backupRet)
        return ResOK(cb, { ...res, payload: backupRet })
    } catch (error) {
        return ResErr(cb, error)
    }
}

function doBackup() {
    return new Promise((reslove, reject) => {
        // 初始化备份对象
        let backup = new DynamoBackup({
            bucket: 'backup-na',
            excludedTables: ['HeraGameRecord', 'ZeusPlatformLog', 'HeraGamePlayerBill', 'HeraGameDiamondBill', 'ZeusPlatformBill', 'HawkeyeGameEmail', 'HawkeyePlayerEmailRecord'],
            stopOnFailure: true,
            base64Binary: false,
            awsAccessKey: process.env.ACCESS_KEY,
            awsSecretKey: process.env.SECRET_KEY,
            awsRegion: 'ap-southeast-1'
        })
        let res = ''
        backup.on('error', function (data) {
            console.error('备份发生错误：' + data.table)
            console.error(data.err)
            return reslove(['备份发生错误：' + data.table + '详细：' + data.err, false])
        })
        backup.on('start-backup', function (tableName, startTime) {
            res += ('开始备份表：' + tableName + '，开始时间：' + startTime)
        })
        backup.on('end-backup', function (tableName, backupDuration) {
            res += ('结束备份表：' + tableName + '耗时：' + backupDuration)
        })
        backup.backupAllTables(function () {
            res += '所有表备份结束！'
        })
        return reslove([false, res])
    })
}

// ==================== 以下为内部方法 ====================

export {
    backup                     // 组织架构
}
