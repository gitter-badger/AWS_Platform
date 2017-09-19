const AWS = require('aws-sdk')
const Backup = require('dynamodb-backup-restore').Backup
const moment = require('moment')
const schedule = require('node-schedule')
const config = require('config')
// 基础数据
const region = 'ap-southeast-1'                          // 区域
const FullBucket = 'backup-rotta-full-' + config.stage   // 全备份桶
const IncBucket = 'backup-rotta-inc-' + config.stage     // 增量备份桶
// 备份区域
const S3Region = region
const DbRegion = region
AWS.config.update({ region: region })
AWS.config.setPromisesDependency(require('bluebird'))
// 全备份数据库表
const FullBackupTables = config.fullBackupTables
// 增量备份数据库表
const IncBackupTables = config.incBackupTables

// 每天定时备份
console.info('定时任务开始执行...')
schedule.scheduleJob(config.cron, function () {
    // 执行全备份
    backup(FullBucket)
    // 执行增量备份
    incBackup(IncBucket)
})

/**
 * 全备份数据表
 */
async function backup(bucket) {
    console.info(moment().format('YYYY-MM-DD_HH:mm:ss') + ':==========开始全备份==========')
    try {
        for (let fullTable of FullBackupTables) {
            let config = {
                S3Bucket: bucket,
                S3Prefix: fullTable + '_' + moment().format('YYYY-MM-DD_HH:mm:ss'),
                S3Region: S3Region,
                DbTable: fullTable,
                DbRegion: DbRegion
            }
            await new Backup(config).full()
            console.info('全备份表【' + fullTable + '】完成')
        }
        console.info(moment().format('YYYY-MM-DD_HH:mm:ss') + ':==========全备份所有表完成==========')
    } catch (error) {
        console.error('全备份表捕获异常：' + error)
    }
}

/**
 * 增量备份数据表
 */
async function incBackup(bucket) {
    console.info(moment().format('YYYY-MM-DD_HH:mm:ss') + ':==========开始增量备份==========')
    try {
        // 今日日期
        const incDate = moment().subtract(1, "days").format('YYYY-MM-DD')
        // 循环所有需要增量备份的表
        for (let incTable of IncBackupTables) {
            const [err, ret] = await Store$('query', {
                TableName: incTable,
                IndexName: 'CreatedDateIndex',
                KeyConditionExpression: 'createdDate = :date',
                ExpressionAttributeValues: {
                    ':date': incDate
                }
            })
            if (err) {
                console.error('查询增量备份表【' + incTable + '】发生错误：' + err)
            }
            else {
                // 备份数据到S3
                const [s3err, s3ret] = await S3Store$(bucket, incTable + '_' + incDate, JSON.stringify(ret))
                if (s3err) {
                    console.error('增量备份表【' + incTable + '】到S3发生错误：' + s3err)
                }
                else {
                    console.info('增量备份表【' + incTable + '】完成')
                }
            }
        }
        console.info(moment().format('YYYY-MM-DD_HH:mm:ss') + ':==========增量备份所有表完成==========')
    } catch (error) {
        console.error('增量备份表捕获异常：' + error)
    }
}


// 存储对象数据到S3
function S3Store$(bucket, key, data) {
    return new Promise((reslove, reject) => {
        new AWS.S3().putObject({
            Bucket: bucket,
            Key: key,
            Body: data
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

// 私有日期格式化方法
Date.prototype.Format = function (fmt) {
    var o = {
        "M+": this.getMonth() + 1, //月份 
        "d+": this.getDate(), //日 
        "h+": this.getHours(), //小时 
        "m+": this.getMinutes(), //分 
        "s+": this.getSeconds(), //秒 
        "q+": Math.floor((this.getMonth() + 3) / 3), //季度 
        "S": this.getMilliseconds() //毫秒 
    };
    if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
    for (var k in o)
        if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
    return fmt;
}