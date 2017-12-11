import { Tables, Store$, Codes, BizErr, Model, RoleCodeEnum, RoleModels } from '../lib/all'
import { BaseModel } from './BaseModel'
import _ from 'lodash'

export class PlayerBillDetailModel extends BaseModel {
    constructor() {
        super()
        // 设置表名
        this.params = {
            TableName: Tables.PlayerBillDetail,
        }
        // 设置对象属性
        this.item = {
            ...this.baseitem
        }
    }
    /**
     * 查询用户排行
     */
    async scanBillDetail() {
        const [err, ret] = await this.scan({
            ProjectionExpression: 'userName,#type,#amount',
            FilterExpression: '#type = :type1 OR #type = :type2',
            ExpressionAttributeNames: {
                '#type': 'type',
                '#amount': 'amount'
            },
            ExpressionAttributeValues: {
                ':type1': 3,
                ':type2': 4
            }
        })
        return [0, ret.Items]
    }

}
