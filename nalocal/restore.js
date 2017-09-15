const Restore = require('dynamodb-backup-restore').Restore
const moment = require('moment')
// 基础数据
const stage = '-prod'
const region = 'ap-southeast-1'
// 全备份桶
const FullBucket = 'backup-rotta-full' + stage
// 备份区域
const S3Region = region
const DbRegion = region

// 执行全备份
restore(FullBucket, 'SYSConfig_2017-09-14_12:30:06', 'SYSConfig')

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
