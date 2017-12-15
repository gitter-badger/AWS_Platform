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
        //查询
        const [err, ret] = await this.scan({
            FilterExpression: 'operatorRole=:operatorRole',
            ExpressionAttributeValues: {
                ':operatorRole': RoleCodeEnum.PlatformAdmin
            }
        })
        let sortResult = _.sortBy(ret.Items, ['createdAt'])
        let sortResult2 = []
        if (inparam.operatorName) {
            query = {
                FilterExpression: 'operatorName=:operatorName',
                ExpressionAttributeValues: {
                    ':operatorName': inparam.operatorName
                }
            }
            const [err2, ret2] = await this.scan(query)
            sortResult2 = _.sortBy(ret2.Items, ['createdAt'])
        }
        let retArr = _.difference(sortResult, sortResult2)
        return [0, retArr]
    }
}


