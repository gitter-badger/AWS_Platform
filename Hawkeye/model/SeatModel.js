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
            FilterExpression: 'operatorRole=:operatorRole',
            ExpressionAttributeValues: {
                ':operatorRole': RoleCodeEnum.PlatformAdmin
            }
        }
        if (inparam.operatorName) {
            query = {
                FilterExpression: 'operatorName=:operatorName',
                ExpressionAttributeValues: {
                    ':operatorName': inparam.operatorName
                }
            }
        }
        // 查询
        const [err, ret] = await this.scan(query)
        if (err) {
            return [err, 0]
        }
        // 如果没有数据，再查询平台的数据
        if (!ret.Items || ret.Items.length == 0) {
            const [err2, ret2] = await this.scan({
                FilterExpression: 'operatorRole=:operatorRole',
                ExpressionAttributeValues: {
                    ':operatorRole': RoleCodeEnum.PlatformAdmin
                }
            })
            return [0, ret2.Items]
        }
        return [0, ret.Items]
    }
}

