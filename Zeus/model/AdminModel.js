import { Tables, Store$, Codes, BizErr, Model, StatusEnum, RoleCodeEnum, RoleModels } from '../lib/all'
import _ from 'lodash'
import { BaseModel } from './BaseModel'
export class AdminModel extends BaseModel {
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
     * 查询管理员列表
     * @param {*} token 
     * @param {*} inparam 
     */
    async page(token, inparam) {
        let query = {
            KeyConditionExpression: '#role = :role',
            ExpressionAttributeNames: {
                '#role': 'role'
            },
            ExpressionAttributeValues: {
                ':role': RoleCodeEnum.PlatformAdmin
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
        // 去除敏感数据
        adminRet.Items = _.map(adminRet.Items, (item) => {
            item.passhash = null
            return item
        })
        // 排序输出
        let sortResult = _.sortBy(adminRet.Items, [inparam.sortkey || 'createdAt'])
        if (inparam.sort == "desc") { sortResult = sortResult.reverse() }
        return [0, sortResult]
    }
}
