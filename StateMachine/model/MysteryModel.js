import { Tables, Store$, Codes, BizErr, Empty, Model, Keys, Pick, Omit, StatusEnum, RoleCodeEnum, RoleModels } from '../lib/all'
import _ from 'lodash'
import { BaseModel } from './BaseModel'
export class MysteryModel extends BaseModel {
    constructor() {
        super()
        // 设置表名
        this.params = {
            TableName: Tables.SYSMystery,
        }
        // 设置对象属性
        this.item = {
            ...this.baseitem,
            sn: Model.StringValue,
            winAt: Model.NumberValue
        }
    }

    /**
     * 添加神秘大奖记录
     * @param {*} inparam 
     */
    async add(inparam) {
        const [err, ret] = await this.putItem(inparam)
        if (err) {
            return [err, 0]
        }
        return [0, ret]
    }

    /**
     * 查询神秘大奖列表
     * @param {*} inparam 
     */
    async page(inparam) {
        let query = {}
        // 条件搜索
        if (!_.isEmpty(inparam.query)) {
            const queryParams = this.buildQueryParams(inparam.query, true)
            query.FilterExpression = queryParams.FilterExpression
            query.ExpressionAttributeNames = { ...query.ExpressionAttributeNames, ...queryParams.ExpressionAttributeNames }
            query.ExpressionAttributeValues = { ...query.ExpressionAttributeValues, ...queryParams.ExpressionAttributeValues }
        }
        const [queryErr, adminRet] = await this.scan(query)
        if (queryErr) {
            return [queryErr, 0]
        }
        // 排序输出
        let sortResult = _.sortBy(adminRet.Items, [inparam.sortkey || 'winAt'])
        if (inparam.sort == "desc") { sortResult = sortResult.reverse() }
        return [0, sortResult]
    }
}
