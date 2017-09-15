const AWS = require('aws-sdk')
const Restore = require('dynamodb-backup-restore').Restore
const moment = require('moment')
const _ = require('lodash')
// 基础数据
const stage = '-prod'                           // 阶段
// const stage = ''
const region = 'ap-southeast-1'                 // 区域
const FullBucket = 'backup-rotta-full' + stage  // 全备份桶
const IncBucket = 'backup-rotta-inc' + stage    // 增量备份桶
// 备份区域
const S3Region = region
const DbRegion = region
AWS.config.update({ region: region })
AWS.config.setPromisesDependency(require('bluebird'))

// 执行表恢复
restore(FullBucket, 'SYSConfig_2017-09-14_12:30:06', 'SYSConfig')
// 执行表增量恢复
incRestore(IncBucket, 'ZeusPlatformLog_2017-09-14', 'ZeusPlatformLog')
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