import { Tables, Store$, Codes, BizErr, Trim, Empty, Model, Keys, Pick, Omit, RoleCodeEnum, RoleModels } from '../lib/all'
import _ from 'lodash'
import { BaseModel } from './BaseModel'

export class ConfigMultModel extends BaseModel {
    constructor() {
        super()
        // 设置表名
        this.params = {
            TableName: Tables.SYSConfigMult,
        }
        // 设置对象属性
        this.item = {
            ...this.baseitem,
            code: Model.StringValue,
            businessKey: Model.StringValue
        }
    }

    /**
     * 添加
     * @param {*} inparam
     */
    async add(inparam) {
        const dataItem = {
            ...this.item,
            ...inparam
        }
        // 保存
        const [putErr, putRet] = await this.putItem(dataItem)
        if (putErr) {
            return [putErr, 0]
        }
        return [0, dataItem]
    }

    /**
     * 查询单个
     * @param {*} inparam
     */
    async getOne(inparam) {
        const [err, ret] = await this.query({
            KeyConditionExpression: '#code = :code AND #businessKey = :businessKey',
            ExpressionAttributeNames: {
                '#code': 'code',
                '#businessKey': 'businessKey'
            },
            ExpressionAttributeValues: {
                ':code': inparam.code,
                ':businessKey': inparam.businessKey
            }
        })
        if (err) {
            return [err, 0]
        }
        if (ret.Items.length > 0) {
            return [0, ret.Items[0]]
        } else {
            return [0, 0]
        }
    }

    /**
     * 查询列表
     * @param {*} inparam
     */
    async page(inparam) {
        let query = {
            KeyConditionExpression: '#code = :code',
            ExpressionAttributeNames: {
                '#code': 'code',
            },
            ExpressionAttributeValues: {
                ':code': inparam.code,
            }
        }
        // 条件搜索
        if (!_.isEmpty(inparam.query)) {
            const queryParams = this.buildQueryParams(inparam.query, true)
            query.FilterExpression = queryParams.FilterExpression
            query.ExpressionAttributeNames = { ...query.ExpressionAttributeNames, ...queryParams.ExpressionAttributeNames }
            query.ExpressionAttributeValues = { ...query.ExpressionAttributeValues, ...queryParams.ExpressionAttributeValues }
        }
        const [queryErr, adminRet] = await this.query(query)
        if (queryErr) {
            return [queryErr, 0]
        }
        // 排序输出
        let sortResult = _.sortBy(adminRet.Items, [inparam.sortkey || 'createdAt'])
        if (inparam.sort == "desc") { sortResult = sortResult.reverse() }
        return [0, sortResult]
    }
}


