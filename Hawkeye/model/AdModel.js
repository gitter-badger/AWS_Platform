import { Tables, Codes, BizErr, Model, RoleCodeEnum, RoleModels } from '../lib/all'
import _ from 'lodash'
import { BaseModel } from './BaseModel'

export class AdModel extends BaseModel {
    constructor() {
        super()
        // 设置表名
        this.params = {
            TableName: Tables.HulkPlatformAd,
        }
        // 设置对象属性
        this.item = {
            ...this.baseitem,
            adId: Model.StringValue
        }
    }
    /**
     * 列表
     * @param {*} inparam
     */
    async list(inparam) {
        let query = {
            FilterExpression: 'operatorRole=:operatorRole',
            ExpressionAttributeValues: {
                ':operatorRole': RoleCodeEnum.PlatformAdmin
            }
        }
        if (!inparam.operatorName) {
            query = {
                FilterExpression: 'operatorName=:operatorName',
                ExpressionAttributeValues: {
                    ':operatorName': inparam.operatorName
                }
            }
        }
        const [err, ret] = await this.scan(query)
        if (err) {
            return [err, 0]
        }
        const sortResult = _.sortBy(ret.Items, ['createdAt'])
        return [0, sortResult]
    }
}


