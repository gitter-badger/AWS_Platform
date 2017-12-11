import { Tables, Store$, Codes, BizErr, Model, StatusEnum, RoleCodeEnum, RoleModels } from '../lib/all'
import _ from 'lodash'
import { BaseModel } from './BaseModel'
export class MerchantModel extends BaseModel {
    constructor() {
        super()
        // 设置表名
        this.params = {
            TableName: Tables.ZeusPlatformUser,
        }
        // 设置对象属性
        this.item = {
            ...this.baseitem
        }
    }

    /**
     * 线路商列表页
     * @param {*} token 
     * @param {*} inparam 
     */
    async page(token, inparam) {
        let query = {
            IndexName: 'RoleParentIndex',
            KeyConditionExpression: '#role = :role and parent = :parent',
            ExpressionAttributeNames: {
                '#role': 'role'
            },
            ExpressionAttributeValues: {
                ':parent': token.userId,
                ':role': RoleCodeEnum.Merchant
            }
        }
        if (Model.isPlatformAdmin(token)) {
            query = {
                IndexName: 'RoleParentIndex',
                KeyConditionExpression: '#role = :role',
                ExpressionAttributeNames: {
                    '#role': 'role'
                },
                ExpressionAttributeValues: {
                    ':role': RoleCodeEnum.Merchant
                }
            }
        }
        // 条件搜索
        if (!_.isEmpty(inparam.query)) {
            if (inparam.query.msn) { inparam.query.msn = parseInt(inparam.query.msn).toString() }
            if (inparam.query.suffix) { inparam.query.suffix = { $like: inparam.query.suffix } }
            if (inparam.query.displayName) { inparam.query.displayName = { $like: inparam.query.displayName } }
            const queryParams = this.bindFilterParams(query, inparam.query, false)
            // query.FilterExpression = queryParams.FilterExpression
            // query.ExpressionAttributeNames = { ...query.ExpressionAttributeNames, ...queryParams.ExpressionAttributeNames }
            // query.ExpressionAttributeValues = { ...query.ExpressionAttributeValues, ...queryParams.ExpressionAttributeValues }
        }
        const [queryErr, queryRet] = await this.query(query)
        if (queryErr) {
            return [queryErr, 0]
        }
        // 去除敏感数据
        const users = _.map(queryRet.Items, (item) => {
            item.passhash = null
            if (!Model.isPlatformAdmin(token)) {
                item.password = '********'
            }
            return item
        })
        // 排序输出
        let sortResult = _.sortBy(users, [inparam.sortkey || 'level'])
        if (inparam.sort == "desc") { sortResult = sortResult.reverse() }
        return [0, sortResult]
    }


}
