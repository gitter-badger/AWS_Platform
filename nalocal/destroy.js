const AWS = require('aws-sdk')
const Restore = require('dynamodb-backup-restore').Restore
const moment = require('moment')
const _ = require('lodash')
const config = require('config')
const prompt = require('prompt-sync')()
// 基础数据
const region = config.region
AWS.config.update({ region: region })
AWS.config.setPromisesDependency(require('bluebird'))


console.info('===========================================')
console.info('NA平台DynamoDB数据库清理程式，请根据提示操作')
console.info('===========================================')

batchDelete()

/**
 * 批量删除数据
 */
async function batchDelete() {
    console.info('==========开始批量删除==========:' + moment().format('YYYY-MM-DD_HH:mm:ss'))
    try {
        let isContinue = true
        let startKey = null
        let finalRet = []
        let tableName = 'HeraGameRecord'
        // 单表中每页数据遍历
        while (isContinue) {
            const [err, ret] = await Store$('scan', {
                Limit: 100,
                ExclusiveStartKey: startKey,
                TableName: tableName
            })
            if (err) {
                console.error('查询需要批量删除的表【' + tableName + '】发生错误：' + err)
                return
            }
            console.info(ret.Items.length)
            // 累加结果
            finalRet.push(...ret.Items)
            // 重置起始key
            if (!_.isEmpty(ret.LastEvaluatedKey)) {
                startKey = ret.LastEvaluatedKey
            }
            else {
                isContinue = false
            }
            // 批量删除
            for (let item of ret.Items) {
                const [err, ret] = await Store$('delete', {
                    TableName: tableName,
                    Key: {
                        'userName': item.userName,
                        'betId': item.betId
                    }
                })
                if (err) {
                    console.error('删除数据发生错误：' + err)
                    return
                }
            }
        }
        console.info('==========批量删除完成==========:' + moment().format('YYYY-MM-DD_HH:mm:ss'))
    } catch (error) {
        console.error('批量删除捕获异常：' + error)
    }
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