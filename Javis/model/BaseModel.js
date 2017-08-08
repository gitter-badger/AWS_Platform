import {
    Tables,
    Store$,
    Codes,
    BizErr,
    Trim,
    Empty,
    Model,
    Keys,
    Pick,
    Omit
} from '../lib/all'

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
                    return reslove([BizErr.DBErr(err.toString()), false])
                })
        })
    }

    /**
     * 
     * @param {*} query 
     * @param {*} inparam (pageSize,startKey)
     */
    async page(query, inparam) {
        let pageData = { Items: [], LastEvaluatedKey: {} }
        let [err, ret] = [0, 0]
        while (pageData.Items.length < inparam.pageSize && pageData.LastEvaluatedKey) {
            [err, ret] = await this.query({
                ...query,
                ExclusiveStartKey: inparam.startKey
            })
            if (err) {
                return [err, 0]
            }
            // 追加数据
            if (pageData.Items.length > 0) {
                pageData.Items.push(...ret.Items)
                pageData.LastEvaluatedKey = ret.LastEvaluatedKey
            } else {
                pageData = ret
            }
            inparam.startKey = ret.LastEvaluatedKey
        }
        return [err, pageData]
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

}
