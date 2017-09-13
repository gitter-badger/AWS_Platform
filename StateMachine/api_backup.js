import { ResOK, ResErr, JSONParser, BizErr, RoleCodeEnum, Model, Codes, Pick } from './lib/all'
import { BaseModel } from './model/BaseModel'
// let DynamoBackup = require('dynamo-backup-to-s3')
// let DynamoRestore = require('dynamo-backup-to-s3').Restore

const Backup = require('dynamodb-backup-restore').Backup
const Restore = require('dynamodb-backup-restore').Restore
const moment = require('moment')
const S3Bucket = 'backup-na'
const S3Region = 'ap-southeast-1'
const DbRegion = 'ap-southeast-1'

/**
 * 备份数据表
 */
const backup = async (e, c, cb) => {
    try {
        // 入参转换和校验
        const [jsonParseErr, inparam] = JSONParser(e && e.body)
        // 身份令牌
        const [tokenErr, token] = await Model.currentToken(e)
        // 开始备份
        // const [backupErr, backupRet] = await doBackup()
        // if (backupErr) { return ResErr(cb, backupErr) }
        let config = {
            S3Bucket: S3Bucket,
            S3Prefix: inparam.table + '_' + moment().format('YYYY-MM-DD_HH:mm:ss'),
            S3Region: S3Region,
            DbTable: inparam.table,
            DbRegion: DbRegion
        }
        await new Backup(config).full()
        return ResOK(cb, { payload: '备份完成' })
    } catch (error) {
        return ResErr(cb, error)
    }
}

/**
 * 恢复数据表
 */
const restore = async (e, c, cb) => {
    try {
        // 入参转换和校验
        const [jsonParseErr, inparam] = JSONParser(e && e.body)
        // 身份令牌
        const [tokenErr, token] = await Model.currentToken(e)
        // 开始备份
        // const [backupErr, backupRet] = await doRestore()
        // if (backupErr) { return ResErr(cb, backupErr) }
        let config = {
            S3Bucket: S3Bucket,
            S3Prefix: inparam.s3,
            S3Region: S3Region,
            DbTable: inparam.table,
            DbRegion: DbRegion
        }
        await Restore(config)
        return ResOK(cb, { payload: '恢复完成' })
    } catch (error) {
        return ResErr(cb, error)
    }
}

/**
 * 增量备份数据表
 */
const incBackup = async (e, c, cb) => {
    try {
        // 入参转换和校验
        const [jsonParseErr, inparam] = JSONParser(e && e.body)
        // 身份令牌
        const [tokenErr, token] = await Model.currentToken(e)
        // 开始备份
        const [err, ret] = await new BaseModel().query({
            TableName: inparam.table,
            IndexName: 'CreatedDateIndex',
            KeyConditionExpression: 'createdDate = :date',
            ExpressionAttributeValues: {
                ':date': inparam.date
            }
        })
        if (err) { return ResErr(cb, err) }
        return ResOK(cb, { payload: ret })
    } catch (error) {
        return ResErr(cb, error)
    }
}

// function doBackup() {
//     return new Promise((reslove, reject) => {
//         // 初始化备份对象
//         let backup = new DynamoBackup({
//             bucket: 'backup-na',
//             includedTables: ['SYSConfig'],
//             // excludedTables: ['HeraGameRecord', 'ZeusPlatformLog', 'HeraGamePlayerBill', 'HeraGameDiamondBill', 'ZeusPlatformBill', 'HawkeyeGameEmail', 'HawkeyePlayerEmailRecord'],
//             stopOnFailure: true,
//             base64Binary: false,
//             awsAccessKey: process.env.ACCESS_KEY,
//             awsSecretKey: process.env.SECRET_KEY,
//             awsRegion: 'ap-southeast-1'
//         })
//         let res = ''
//         backup.on('error', function (data) {
//             console.error('备份发生错误：' + data.table)
//             console.error(data.err)
//             return reslove(['备份发生错误：' + data.table + '详细：' + data.err, false])
//         })
//         backup.on('start-backup', function (tableName, startTime) {
//             res += ('开始备份表：' + tableName + '，开始时间：' + startTime)
//         })
//         backup.on('end-backup', function (tableName, backupDuration) {
//             res += ('结束备份表：' + tableName + '耗时：' + backupDuration)
//         })
//         backup.backupAllTables(function () {
//             res += '所有表备份结束！'
//         })
//         return reslove([false, res])
//     })
// }

// function doRestore() {
//     return new Promise((reslove, reject) => {
//         var restore = new DynamoRestore({
//             source: 's3://backup-na/DynamoDB-backup-2017-09-11-06-56-34/SYSConfig.json',
//             table: 'SYSConfig',
//             overwrite: true,
//             concurrency: 200, // for large restores use 1 unit per MB as a rule of thumb (ie 1000 for 1GB restore)
//             awsAccessKey: process.env.ACCESS_KEY,
//             awsSecretKey: process.env.SECRET_KEY,
//             awsRegion: 'ap-southeast-1'
//         })
//         let res = ''
//         restore.on('error', function (message) {
//             console.error('恢复发生错误：' + message)
//             res += '恢复发生错误：' + message
//             return reslove(['恢复发生错误：' + message, false])
//         })

//         restore.on('warning', function (message) {
//             console.error('恢复发生警告：' + message)
//             res += '恢复发生警告：' + message
//             return reslove(['恢复发生警告：' + message, false])
//         })

//         restore.on('send-batch', function (batches, requests, streamMeta) {
//             console.log('Batch sent. %d in flight. %d Mb remaining to download...', requests, streamMeta.RemainingLength / (1024 * 1024))
//         })

//         restore.run(function () {
//             res += '表恢复结束！'
//         })
//         return reslove([false, res])
//     })
// }

// ==================== 以下为内部方法 ====================

export {
    backup,
    restore,
    incBackup
}
