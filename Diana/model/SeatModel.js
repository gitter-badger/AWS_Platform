import {
    Tables,
    Store$,
    Codes,
    BizErr,
    Trim,
    Empty,
    Model,
    Keys,
    Pick,
    Omit,
    RoleCodeEnum,
    RoleModels,
    SeatStatusEnum,
    SeatTypeEnum
} from '../lib/all'
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
     * 添加席位
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
     * 席位列表
     * @param {*} inparam
     */
    async list(inparam) {
        // 查询
        const [err, ret] = await this.scan({
            // FilterExpression: ranges,
            // ExpressionAttributeValues: values
        })
        if (err) {
            return [err, 0]
        }
        const sortResult = _.sortBy(ret.Items, ['order'])
        return [0, sortResult]
    }

    /**
     * 更新席位状态
     * @param {入参} inparam 
     */
    async changeStatus(inparam) {
        const [err, ret] = await this.updateItem({
            Key: {
                'seatId': inparam.seatId
            },
            UpdateExpression: "SET seatStatus = :status",
            ExpressionAttributeValues: {
                ':status': inparam.status
            }
        })
        return [err, ret]
    }

    /**
     * 更新席位
     * @param {席位对象} inparam 
     */
    async update(inparam) {
        const [err, ret] = await this.getOne(inparam)
        if (err) {
            return [err, 0]
        }
        if (!ret) {
            return [new BizErr.ItemNotExistErr(), 0]
        }
        ret.updatedAt = Model.timeStamp()
        return await this.putItem(ret)
    }

    /**
     * 查询单个席位
     * @param {*} inparam
     */
    async getOne(inparam) {
        const [err, ret] = await this.query({
            KeyConditionExpression: 'seatId = :seatId',
            ExpressionAttributeValues: {
                ':seatId': inparam.seatId
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
     * 删除席位
     * @param {*} inparam
     */
    async delete(inparam) {
        const [err, ret] = await this.deleteItem({
            Key: {
                'seatId': inparam.seatId
            }
        })
        if (err) {
            return [err, 0]
        }
        return [0, ret]
    }
}


