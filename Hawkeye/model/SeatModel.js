import { Tables, Store$, Codes, BizErr, Model, RoleCodeEnum } from '../lib/all'
import _ from 'lodash'
import { BaseModel } from './BaseModel'

export class SeatModel extends BaseModel {
    constructor() {
        super()
        // 设置表名
        this.params = {
            TableName: Tables.DianaPlatformSeat,
        }
        // 设置对象属性
        this.item = {
            ...this.baseitem,
            seatId: Model.uuid()
        }
    }

    /**
     * 席位列表
     * @param {*} inparam
     */
    async list(inparam) {
        let query = {
            IndexName: 'SeatTypeIndex',
            FilterExpression: 'operatorRole=:operatorRole',
            ExpressionAttributeValues: {
                ':operatorRole': RoleCodeEnum.PlatformAdmin
            }
        }
        if (inparam.operatorMsn) {
            query = {
                IndexName: 'SeatTypeIndex',
                FilterExpression: 'operatorMsn=:operatorMsn',
                ExpressionAttributeValues: {
                    ':operatorMsn': inparam.operatorMsn
                }
            }
        }
        // 查询
        const [err, ret] = await this.scan(query)
        if (err) {
            return [err, 0]
        }
        return [0, ret.Items]
    }
}


