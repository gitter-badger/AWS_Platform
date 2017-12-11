import { Tables, Store$, Codes, BizErr, Model } from '../lib/all'
import _ from 'lodash'
import zlib from 'zlib'
import AWS from 'aws-sdk'
AWS.config.update({ region: 'ap-southeast-1' })
// AWS.config.setPromisesDependency(require('bluebird'))
const dbClient = new AWS.DynamoDB.DocumentClient()

export class BaseModel {
    /**
     * 构造方法，设置基础对象属性
     */
    constructor() {
        this.baseitem = Model.baseModel()
    }

    /**
     * 数据库操作流对象
     * @param {*} action 
     * @param {*} params 
     */
    db$(action, params) {
        return dbClient[action](params).promise()
    }

    /**
     * 插入单项
     * @param {*} item 
     */
    putItem(item) {
        return new Promise((reslove, reject) => {
            const params = {
                ...this.params,
                Item: {
                    ...this.baseitem,
                    ...item
                }
            }
            this.db$('put', params)
                .then((res) => {
                    return reslove([false, res])
                }).catch((err) => {
                    return reslove([BizErr.DBErr(err.toString()), false])
                })
        })
    }

    /**
     * 批量插入
     * @param {*} batch
     */
    batchWrite(batch) {
        return new Promise((reslove, reject) => {
            this.db$('batchWrite', batch)
                .then((res) => {
                    return reslove([false, res])
                }).catch((err) => {
                    return reslove([BizErr.DBErr(err.toString()), false])
                })
        })
    }

    /**
     * 更新单项
     * @param {*} conditions 
     */
    updateItem(conditions) {
        return new Promise((reslove, reject) => {
            const params = {
                ...this.params,
                ...conditions
            }
            this.db$('update', params)
                .then((res) => {
                    return reslove([false, res])
                }).catch((err) => {
                    return reslove([BizErr.DBErr(err.toString()), false])
                })
        })
    }

    /**
     * 删除单项
     * @param {*} conditions 
     */
    deleteItem(conditions) {
        return new Promise((reslove, reject) => {
            const params = {
                ...this.params,
                ...conditions
            }
            this.db$('delete', params)
                .then((res) => {
                    return reslove([false, res])
                }).catch((err) => {
                    return reslove([BizErr.DBErr(err.toString()), false])
                })
        })
    }

    /**
     * 查询是否存在
     * @param {*} conditions 
     */
    isExist(conditions) {
        return new Promise((reslove, reject) => {
            const params = {
                ...this.params,
                ...conditions
            }
            this.db$('query', params)
                .then((res) => {
                    let exist = false
                    if (res && !res.Items) { exist = true }
                    if (res && res.Items && res.Items.length > 0) { exist = true }
                    return reslove([0, exist])
                }).catch((err) => {
                    return reslove([BizErr.DBErr(err.toString()), false])
                })
        })
        // const params = {
        //     ...this.params,
        //     ...conditions
        // }
        // const [queryErr, queryRet] = await Store$('query', params)
        // return [queryErr, queryRet]
    }
    /**
     * 递归查询所有数据
     */
    query(conditions = {}) {
        const params = {
            ...this.params,
            ...conditions
        }
        return this.queryInc(params, null)
    }

    /**
     * 单次查询
     * @param {*} conditions 
     */
    queryOnce(conditions = {}) {
        // return new Promise((reslove, reject) => {
        const params = {
            ...this.params,
            ...conditions
        }
        return this.db$('query', params)
        // .then((res) => {
        //     return reslove([0, res])
        // }).catch((err) => {
        //     return reslove([BizErr.DBErr(err.toString()), false])
        // })
        // })
    }

    /**
     * 分页查询
     * @param {*} query 
     * @param {*} inparam (pageSize,startKey)
     */
    async page(query, inparam) {
        // 初始化返回数据
        let pageData = { Items: [], LastEvaluatedKey: {} }
        // 查询数量不足且数据库仍有数据，则继续循环查询
        while (pageData.Items.length < inparam.pageSize && pageData.LastEvaluatedKey) {
            let ret = await this.queryOnce({
                ...query,
                Limit: inparam.pageSize,
                ExclusiveStartKey: inparam.startKey
            })
            // 追加数据
            if (pageData.Items.length > 0) {
                pageData.Items.push(...ret.Items)
            } else {
                pageData = ret
            }
            // 更新最后一条键值
            pageData.LastEvaluatedKey = ret.LastEvaluatedKey
            // 更新起始KEY
            inparam.startKey = ret.LastEvaluatedKey
            // 需要查询的数量减少
            inparam.pageSize -= ret.Items.length
        }
        // 最后查询键
        pageData.LastEvaluatedKey = _.pick(pageData.Items[pageData.Items.length - 1], inparam.lastEvaluatedKeyTemplate)
        // 最后数据超过指定长度，则截取指定长度
        // if (pageData.Items.length > inparam.pageSize) {
        //     pageData.Items = _.slice(pageData.Items, 0, inparam.pageSize)
        //     pageData.LastEvaluatedKey = _.pick(pageData.Items[pageData.Items.length - 1], inparam.LastEvaluatedKeyTemplate)
        // }
        return [0, pageData]
    }

    /**
     * 全表查询数据
     */
    scan(conditions = {}) {
        return new Promise((reslove, reject) => {
            const params = {
                ...this.params,
                ...conditions
            }
            this.db$('scan', params)
                .then((res) => {
                    return reslove([0, res])
                }).catch((err) => {
                    return reslove([BizErr.DBErr(err.toString()), false])
                })
        })
    }

    // 内部增量查询，用于结果集超过1M的情况
    queryInc(params, result) {
        return this.db$('query', params).then((res) => {
            if (!result) {
                result = res
            } else {
                result.Items.push(...res.Items)
            }
            if (res.LastEvaluatedKey) {
                params.ExclusiveStartKey = res.LastEvaluatedKey
                return this.queryInc(params, result)
            } else {
                return [false, result]
            }
        }).catch((err) => {
            return [BizErr.DBErr(err.toString()), false]
        })
    }

    /**
     * 构建搜索条件
     * @param {*} conditions 查询条件对象
     * @param {*} isDefault 是否默认全模糊搜索
     */
    buildQueryParams(conditions = {}, isDefault) {
        // 默认设置搜索条件，所有查询模糊匹配
        if (isDefault) {
            for (let key in conditions) {
                if (!_.isArray(conditions[key])) {
                    conditions[key] = { '$like': conditions[key] }
                }
            }
        }
        let keys = Object.keys(conditions), opts = {}
        if (keys.length > 0) {
            opts.FilterExpression = ''
            opts.ExpressionAttributeValues = {}
            opts.ExpressionAttributeNames = {}
        }
        keys.forEach((k, index) => {
            let item = conditions[k]
            let value = item, array = false
            if (_.isArray(item)) {
                opts.FilterExpression += `${k} between :${k}0 and :${k}1`
                // opts.FilterExpression += `${k} > :${k}0 and ${k} < :${k}1`
                opts.ExpressionAttributeValues[`:${k}0`] = item[0]
                opts.ExpressionAttributeValues[`:${k}1`] = item[1]// + 86399999
            }
            else if (Object.is(typeof item, "object")) {
                for (let key in item) {
                    value = item[key]
                    switch (key) {
                        case "$like": {
                            opts.FilterExpression += `contains(#${k}, :${k})`
                            break
                        }
                        case "$in": {
                            array = true
                            opts.ExpressionAttributeNames[`#${k}`] = k
                            for (let i = 0; i < value.length; i++) {
                                if (i == 0) opts.FilterExpression += "("
                                opts.FilterExpression += `#${k} = :${k}${i}`
                                if (i != value.length - 1) {
                                    opts.FilterExpression += " or "
                                }
                                if (i == value.length - 1) {
                                    opts.FilterExpression += ")"
                                }
                                opts.ExpressionAttributeValues[`:${k}${i}`] = value[i]
                            }
                            break
                        }
                        case "$range": {
                            array = true
                            opts.ExpressionAttributeNames[`#${k}`] = k
                            opts.FilterExpression += `#${k} between :${k}0 and :${k}1`
                            opts.ExpressionAttributeValues[`:${k}0`] = value[0]
                            opts.ExpressionAttributeValues[`:${k}1`] = value[1]
                            break
                        }
                    }
                    break
                }
            } else {
                opts.FilterExpression += `#${k} = :${k}`
            }
            if (!array && !_.isArray(value)) {
                opts.ExpressionAttributeValues[`:${k}`] = value
                opts.ExpressionAttributeNames[`#${k}`] = k
            }
            if (index != keys.length - 1) opts.FilterExpression += " and "
        })
        return opts
    }

    /**
     * 压缩
     * @param {*} obj 
     */
    parseZip(obj) {
        return zlib.deflateSync(JSON.stringify(obj)).toString('base64')
    }
    /**
     * 解压
     * @param {*} str 
     */
    unZip(str) {
        return zlib.unzipSync(Buffer.from(str, 'base64')).toString()
    }
}
