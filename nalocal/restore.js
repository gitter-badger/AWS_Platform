const AWS = require('aws-sdk')
const Restore = require('dynamodb-backup-restore').Restore
const moment = require('moment')
const _ = require('lodash')
const prompt = require('prompt-sync')()
// 基础数据
// const stage = '-prod'                           // 阶段
const stage = ''
const region = 'ap-southeast-1'                 // 区域
const FullBucket = 'backup-rotta-full' + stage  // 全备份桶
const IncBucket = 'backup-rotta-inc' + stage    // 增量备份桶
// 备份区域
const S3Region = region
const DbRegion = region
AWS.config.update({ region: region })
AWS.config.setPromisesDependency(require('bluebird'))

// 全备份数据库表
const FullBackupTables = ['ZeusPlatformUser', 'ZeusPlatformMSN', 'ZeusPlatformCaptcha', 'ZeusPlatformCode',
    'DianaPlatformGame', 'DianaPlatformCompany', 'DianaPlatformTool', 'DianaPlatformPackage',
    'DianaPlatformSeat', 'HulkPlatformAd', 'HeraGamePlayer', 'SYSConfig',
    'HawkeyeGameNotice']
// 增量备份数据库表
const IncBackupTables = ['HeraGameRecord', 'ZeusPlatformLog', 'HeraGamePlayerBill',
    'HeraGameDiamondBill', 'ZeusPlatformBill', 'HawkeyeGameEmail', 'HawkeyePlayerEmailRecord']

console.info('===========================================')
console.info('NA平台DynamoDB数据库恢复程式，请根据提示操作')
console.info('===========================================')

let file = prompt('请输入S3恢复文件：')
let table = prompt('请输入需要恢复的DynamoDB数据表：')
if (!file || !table) {
    console.error('恢复未执行，请输入必要参数!!!')
} else {
    // 判断是否是全备份
    if (_.includes(FullBackupTables, table)) {
        restore(FullBucket, file, table)
    } else {
        console.info('增量恢复' + file + table)
        incRestore(IncBucket, file, table)
    }
}

/**
 * 恢复数据表
 */
async function restore(bucket, file, table) {
    console.info('==========开始备份恢复==========:' + moment().format('YYYY-MM-DD_HH:mm:ss'))
    try {
        let config = {
            S3Bucket: bucket,
            S3Prefix: file,
            S3Region: S3Region,
            DbTable: table,
            DbRegion: DbRegion
        }
        await Restore(config)
        console.info('==========恢复数据完成==========:' + moment().format('YYYY-MM-DD_HH:mm:ss'))
    } catch (error) {
        console.error('全备份恢复捕获异常：' + error)
    }
}

/**
 * 恢复增量数据表
 */
async function incRestore(bucket, file, table) {
    console.info('==========开始增量备份恢复==========:' + moment().format('YYYY-MM-DD_HH:mm:ss'))
    try {
        const [s3err, s3ret] = await S3StoreGet$(bucket, file)
        if (s3err) {
            console.error('获取增量文件【' + file + '】发生错误：' + s3err)
        }
        else {
            // 获取所有数据
            const restoreData = JSON.parse(s3ret.Body.toString()).Items
            console.info('总共需要恢复' + restoreData.length + '条记录:' + moment().format('YYYY-MM-DD_HH:mm:ss'))
            // 遍历所有数据，每25条存储一次
            let chunkData = _.chunk(restoreData, 25)
            for (let chunk of chunkData) {
                let batch = { RequestItems: {} }
                batch.RequestItems[table] = []
                for (let item of chunk) {
                    batch.RequestItems[table].push({
                        PutRequest: {
                            Item: item
                        }
                    })
                }
                let [err, ret] = await Store$('batchWrite', batch)
                if (err) {
                    console.error('恢复增量数据至Dynamodb出现错误:' + err)
                }
                console.info('已经恢复25条记录:' + moment().format('YYYY-MM-DD_HH:mm:ss'))
            }
        }
        console.info('==========恢复增量数据完成==========:' + moment().format('YYYY-MM-DD_HH:mm:ss'))
    } catch (error) {
        console.error('全备份恢复捕获异常：' + error)
    }
}

// 从S3获取数据
function S3StoreGet$(bucket, key) {
    return new Promise((reslove, reject) => {
        new AWS.S3().getObject({
            Bucket: bucket,
            Key: key
        }, function (err, data) {
            if (err) {
                return reslove([err, false])
            } else {
                return reslove([false, data])
            }
        })
    })
}

// 数据库封装
async function Store$(action, params) {
    try {
        const result = await new AWS.DynamoDB.DocumentClient()[action](params).promise()
        return [0, result]
    } catch (e) {
        return [e.toString(), 0]
    }
}