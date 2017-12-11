import { Tables, Store$, Codes, BizErr, Model, RoleCodeEnum, MSNStatusEnum, RoleModels } from '../lib/all'

import { BaseModel } from './BaseModel'

export class MsnModel extends BaseModel {
    constructor() {
        super()
        // 设置表名
        this.params = {
            TableName: Tables.ZeusPlatformMSN,
        }
        // 设置对象属性
        this.item = {
            ...this.baseitem,
            msn: Model.StringValue,
            userId: Model.StringValue
        }
    }

    /**
     * 查询MSN
     * @param {*} inparam 
     */
    async queryMSN(inparam) {
        const [queryErr, queryRet] = await this.query({
            KeyConditionExpression: '#msn = :msn',
            ExpressionAttributeNames: {
                '#msn': 'msn',
            },
            ExpressionAttributeValues: {
                ':msn': inparam.msn
            }
        })
        return [0, queryRet]
    }

    /**
     * 检查MSN
     * @param {*} param 
     */
    async checkMSN(param) {
        const [queryErr, queryRet] = await this.query({
            KeyConditionExpression: '#msn = :msn',
            FilterExpression: '#status = :usedStatus or #status = :lockStatus',
            ExpressionAttributeNames: {
                '#msn': 'msn',
                '#status': 'status'
            },
            ExpressionAttributeValues: {
                ':msn': param.msn.toString(),
                ':usedStatus': MSNStatusEnum['Used'],
                ':lockStatus': MSNStatusEnum['Locked']
            }
        })
        return [0, (queryRet.Items.length == 0)]
    }

}
