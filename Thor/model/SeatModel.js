import { Tables, Store$, Codes, BizErr, Trim, Empty, Model, Keys, Pick, Omit, RoleCodeEnum } from '../lib/all'
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
        // 判断编号是否重复
        const [existErr, exist] = await this.isExist({
            IndexName: 'SeatTypeIndex',
            KeyConditionExpression: 'seatType = :seatType AND #order = :order',
            ExpressionAttributeNames: {
                '#order': 'order'
            },
            ExpressionAttributeValues: {
                ':seatType': inparam.seatType,
                ':order': inparam.order
            }
        })
        if (existErr) {
            return [existErr, 0]
        }
        if (exist) {
            return [BizErr.ItemExistErr('编号已存在'), 0]
        }
        // 获取所有添加的道具/礼包id，组合字符串以便查询
        let contentIds = ''
        if (inparam.content['toolId']) {
            contentIds += ('tool_' + inparam.content['toolId'] + ',')
        } else {
            contentIds += ('package_' + inparam.content['packageId'] + ',')
        }
        inparam.contentIds = contentIds.substr(0, contentIds.length - 1)
        // 保存
        const dataItem = {
            ...this.item,
            ...inparam
        }
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
            IndexName: 'SeatTypeIndex',
            FilterExpression: 'seatType = :seatType',
            ExpressionAttributeValues: {
                ':seatType': inparam.seatType,
            }
        })
        if (err) {
            return [err, 0]
        }
        return [0, ret.Items]
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
        // 判断编号是否重复
        const [existErr, exist] = await this.query({
            IndexName: 'SeatTypeIndex',
            KeyConditionExpression: 'seatType = :seatType AND #order = :order',
            ExpressionAttributeNames: {
                '#order': 'order'
            },
            ExpressionAttributeValues: {
                ':seatType': inparam.seatType,
                ':order': inparam.order
            }
        })
        if (existErr) {
            return [existErr, 0]
        }
        console.info('测试数据')
        console.info(exist)
        console.info(inparam.order)
        // console.info(exist.Items[0].order)
        
        if (exist && exist.Items[0] && inparam.seatId != exist.Items[0].seatId) {
            return [BizErr.ItemExistErr('编号已存在'), 0]
        }
        // 更新
        const [err, ret] = await this.getOne(inparam)
        if (err) {
            return [err, 0]
        }
        if (!ret) {
            return [new BizErr.ItemNotExistErr(), 0]
        }
        ret.order = inparam.order
        ret.price = inparam.price
        ret.remark = inparam.remark
        ret.seatStatus = inparam.seatStatus
        ret.seatType = inparam.seatType
        ret.sum = inparam.sum
        ret.content = inparam.content
        ret.updatedAt = Model.timeStamp()

        // 获取所有添加的道具/礼包id，组合字符串以便查询
        let contentIds = ''
        if (inparam.content['toolId']) {
            contentIds += ('tool_' + inparam.content['toolId'] + ',')
        } else {
            contentIds += ('package_' + inparam.content['packageId'] + ',')
        }
        ret.contentIds = contentIds.substr(0, contentIds.length - 1)

        return await this.putItem(ret)
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


