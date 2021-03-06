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
     * 添加席位
     * @param {*} inparam 
     */
    async add(inparam) {
        let query = {
            IndexName: 'SeatTypeIndex',
            KeyConditionExpression: 'seatType = :seatType AND #order = :order',
            ExpressionAttributeNames: {
                '#order': 'order'
            },
            ExpressionAttributeValues: {
                ':seatType': inparam.seatType,
                ':order': inparam.order
            }
        }
        if (!Model.isPlatformAdmin(inparam.token)) {
            query.FilterExpression = 'operatorName = :operatorName'
            query.ExpressionAttributeValues[':operatorName'] = inparam.token.username
        } else {
            query.FilterExpression = 'operatorRole = :operatorRole'
            query.ExpressionAttributeValues[':operatorRole'] = inparam.token.role
        }
        // 判断编号是否重复
        const [existErr, exist] = await this.isExist(query)
        if (exist) { return [BizErr.ItemExistErr('编号已存在'), 0] }
        // 获取所有添加的道具/礼包id，组合字符串以便查询
        let contentIds = ''
        if (inparam.content['toolId']) {
            contentIds += ('tool_' + inparam.content['toolId'] + ',')
        } else {
            contentIds += ('package_' + inparam.content['packageId'] + ',')
        }
        inparam.contentIds = contentIds.substr(0, contentIds.length - 1)
        // 保存
        delete inparam.token
        const dataItem = {
            ...this.item,
            ...inparam
        }
        const [putErr, putRet] = await this.putItem(dataItem)
        return [0, dataItem]
    }

    /**
     * 席位列表
     * @param {*} inparam
     */
    async list(inparam) {
        let query = {
            IndexName: 'SeatTypeIndex',
            FilterExpression: 'seatType = :seatType AND operatorRole=:operatorRole',
            ExpressionAttributeValues: {
                ':seatType': inparam.seatType,
                ':operatorRole': inparam.operatorRole || RoleCodeEnum.PlatformAdmin
            }
        }
        if (!Model.isPlatformAdmin(inparam.token)) {
            query = {
                IndexName: 'SeatTypeIndex',
                FilterExpression: 'seatType = :seatType AND operatorName=:operatorName',
                ExpressionAttributeValues: {
                    ':seatType': inparam.seatType,
                    ':operatorName': inparam.token.username
                }
            }
        }
        // 条件搜索
        if (!_.isEmpty(inparam.query)) {
            if (inparam.query.createdAt) {
                inparam.query.createdAt = { $range: inparam.query.createdAt }
            }
            if (inparam.query.msn) { inparam.query.msn = inparam.query.msn }
            if (inparam.query.displayName) { inparam.query.displayName = { $like: inparam.query.displayName } }
        }
        // 查询
        const [err, ret] = await this.bindFilterScan(query, inparam.query, false)
        const retOrderBy = _.sortBy(ret.Items, ['order'])
        return [0, retOrderBy]
    }

    /**
    * 查看所有商户席位列表
    * @param {*} inparam
    */
    async listAll(inparam) {
        let query = {
            IndexName: 'SeatTypeIndex',
            FilterExpression: 'seatType = :seatType AND operatorRole=:operatorRole',
            ExpressionAttributeValues: {
                ':seatType': inparam.seatType,
                ':operatorRole': inparam.operatorRole || RoleCodeEnum.PlatformAdmin
            }
        }
        if (!Model.isPlatformAdmin(inparam.token)) {
            query = {
                IndexName: 'SeatTypeIndex',
                FilterExpression: 'seatType = :seatType AND operatorName=:operatorName',
                ExpressionAttributeValues: {
                    ':seatType': inparam.seatType,
                    ':operatorName': inparam.token.username
                }
            }
        }
        // 条件搜索
        if (!_.isEmpty(inparam.query)) {
            if (inparam.query.createdAt) {
                inparam.query.createdAt = { $range: inparam.query.createdAt }
            }
            if (inparam.query.msn) { inparam.query.msn = inparam.query.msn }
            if (inparam.query.displayName) { inparam.query.displayName = { $like: inparam.query.displayName } }
        }
        // 查询
        const [err, ret] = await this.bindFilterScan(query, inparam.query, false)
        let objectInfo = _.groupBy(ret.Items, 'operatorDisplayName')

        let arrInfo = []
        for (let key in objectInfo) {
            arrInfo.push(objectInfo[key])
        }
        return [0, arrInfo]
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
        let query = {
            IndexName: 'SeatTypeIndex',
            KeyConditionExpression: 'seatType = :seatType AND #order = :order',
            ExpressionAttributeNames: {
                '#order': 'order'
            },
            ExpressionAttributeValues: {
                ':seatType': inparam.seatType,
                ':order': inparam.order
            }
        }
        if (!Model.isPlatformAdmin(inparam.token)) {
            query.FilterExpression = 'operatorName = :operatorName'
            query.ExpressionAttributeValues[':operatorName'] = inparam.token.username
        } else {
            query.FilterExpression = 'operatorRole = :operatorRole'
            query.ExpressionAttributeValues[':operatorRole'] = inparam.token.role
        }
        query.FilterExpression += ' AND seatId <> :seatId'
        query.ExpressionAttributeValues[':seatId'] = inparam.seatId
        // 判断编号是否重复
        const [existErr, exist] = await this.isExist(query)
        if (exist) { return [BizErr.ItemExistErr('编号已存在'), 0] }
        // 更新
        const [err, ret] = await this.getOne(inparam)
        if (!ret) { return [new BizErr.ItemNotExistErr(), 0] }
        ret.order = inparam.order
        ret.price = inparam.price
        ret.remark = inparam.remark
        ret.seatStatus = inparam.seatStatus
        ret.seatType = inparam.seatType
        ret.sum = inparam.sum
        ret.content = inparam.content
        ret.icon = inparam.icon
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
        return [0, ret]
    }
    /**
     * 展位互换
     * @param {*} inparam
     */
    async seatTigger(inparam) {
        let updatTime=new Date().getTime()
        let updateObj1 = {
            Key: { 'seatId': inparam.beforeSeatId },
            UpdateExpression: 'SET #order=:order ,updatedAt=:updatedAt',
            ExpressionAttributeNames: {
                '#order': 'order'
            },
            ExpressionAttributeValues: {
                ':order': inparam.afterOrder,
                ':updatedAt':updatTime
            }
        }
        this.updateItem(updateObj1).then((res) => {
            console.log(res)
        }).catch((err) => {
            console.error(err)
        })
        let updateObj2 = {
            Key: { 'seatId': inparam.afterSeatId },
            UpdateExpression: 'SET #order=:order,updatedAt=:updatedAt',
            ExpressionAttributeNames: {
                '#order': 'order'
            },
            ExpressionAttributeValues: {
                ':order': inparam.beforeOrder,
                ':updatedAt':updatTime
            }
        }
        this.updateItem(updateObj2).then((res) => {
            console.log(res)
        }).catch((err) => {
            console.error(err)
        })
        return [0, []]
    }
}


