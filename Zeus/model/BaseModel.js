import { Store$, Codes, BizErr, Model } from '../lib/all'
import _ from 'lodash'
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
     * 更新单项
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
                    return reject([BizErr.DBErr(err.toString()), false])
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
                    return reject([BizErr.DBErr(err.toString()), false])
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
                    return reject([BizErr.DBErr(err.toString()), false])
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
                    return reject([BizErr.DBErr(err.toString()), false])
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
                    const exist = res ? true : false
                    return reslove([0, exist])
                }).catch((err) => {
                    return reject([BizErr.DBErr(err.toString()), false])
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
     * 查询数据
     */
    query(conditions = {}) {
        return new Promise((reslove, reject) => {
            const params = {
                ...this.params,
                ...conditions
            }
            this.db$('query', params)
                .then((res) => {
                    return reslove([0, res])
                }).catch((err) => {
                    return reject([BizErr.DBErr(err.toString()), false])
                })
        })
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
                    return reject([BizErr.DBErr(err.toString()), false])
                })
        })
    }

    /**
     * 绑定筛选条件
     * @param {*} oldquery 原始查询条件
     * @param {*} conditions 查询条件对象
     * @param {*} isDefault 是否默认全模糊搜索
     */
    bindFilterParams(oldquery = {}, conditions = {}, isDefault) {
        if (_.isEmpty(oldquery) || _.isEmpty(conditions)) {
            return
        }
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

        // 绑定筛选至原来的查询对象
        if (oldquery.FilterExpression) {
            oldquery.FilterExpression += (' AND ' + opts.FilterExpression)
        } else {
            oldquery.FilterExpression = opts.FilterExpression
        }
        oldquery.ExpressionAttributeNames = { ...oldquery.ExpressionAttributeNames, ...opts.ExpressionAttributeNames }
        oldquery.ExpressionAttributeValues = { ...oldquery.ExpressionAttributeValues, ...opts.ExpressionAttributeValues }

        return opts
    }
}
