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
     * 添加
     * @param {*} inparam 
     */
    async addAd(inparam) {
        // 判断是否重复
        const [existErr, exist] = await this.isExist({
            IndexName: 'AdNameIndex',
            KeyConditionExpression: 'adName = :adName',
            ExpressionAttributeValues: {
                ':adName': inparam.adName
            }
        })
        if (existErr) {
            return [existErr, 0]
        }
        if (exist) {
            return [BizErr.ItemExistErr('公告已存在'), 0]
        }

        // Start:从编号池获取新编号
        const [uucodeErr, uucodeRet] = await Model.uucode('ad', 6)
        if (uucodeErr) { return [uucodeErr, 0] }
        inparam.adId = uucodeRet

        const dataItem = {
            ...this.item,
            ...inparam
        }
        // 保存
        const [putErr, putRet] = await this.putItem(dataItem)
        if (putErr) {
            return [putErr, 0]
        }
        // End:记录生成的编码
        this.db$('put', { TableName: Tables.ZeusPlatformCode, Item: { type: 'ad', code: inparam.adId } })
        return [0, dataItem]
    }

    /**
     * 列表
     * @param {*} inparam
     */
    async list(inparam) {
        // 查询
        let query = {
            FilterExpression: 'operatorRole=:operatorRole',
            ExpressionAttributeValues: {
                ':operatorRole': inparam.operatorRole || RoleCodeEnum.PlatformAdmin
            }
        }
        if (!Model.isPlatformAdmin(inparam.token)) {
            query = {
                FilterExpression: 'operatorName=:operatorName',
                ExpressionAttributeValues: {
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
            const queryParams = this.buildQueryParams(inparam.query, false)
            query.FilterExpression += (' AND ' + queryParams.FilterExpression)
            query.ExpressionAttributeNames = { ...query.ExpressionAttributeNames, ...queryParams.ExpressionAttributeNames }
            query.ExpressionAttributeValues = { ...query.ExpressionAttributeValues, ...queryParams.ExpressionAttributeValues }
        }
        const [err, ret] = await this.scan(query)
        if (err) {
            return [err, 0]
        }
        const sortResult = _.sortBy(ret.Items, ['createdAt'])
        return [0, sortResult]
    }

    /**
     * 查询单个
     * @param {*} inparam
     */
    async getOne(inparam) {
        const [err, ret] = await this.query({
            KeyConditionExpression: 'adId = :adId',
            ExpressionAttributeValues: {
                ':adId': inparam.adId
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
     * 更新公告状态
     * @param {} inparam 
     */
    async changeStatus(inparam) {
        // 变更状态
        const [err, ret] = await this.updateItem({
            Key: {
                'adId': inparam.adId
            },
            UpdateExpression: "SET adStatus = :status",
            ExpressionAttributeValues: {
                ':status': inparam.status
            }
        })
        return [err, ret]
    }

    /**
     * 更新
     * @param {公告对象} inparam 
     */
    async updateAd(inparam) {
        // 更新
        const [err, ret] = await this.getOne(inparam)
        if (err) {
            return [err, 0]
        }
        if (!ret) {
            return [new BizErr.ItemNotExistErr(), 0]
        }
        ret.img = inparam.img
        ret.url = inparam.url
        ret.remark = inparam.remark
        ret.adName = inparam.adName
        // ret.adStatus = inparam.adStatus
        ret.updatedAt = Model.timeStamp()
        return await this.putItem(ret)
    }

    /**
     * 删除
     * @param {*} inparam
     */
    async delete(inparam) {
        // 删除
        const [err, ret] = await this.deleteItem({
            Key: {
                'adId': inparam.adId
            }
        })
        if (err) {
            return [err, 0]
        }

        // End:删除生成的编码
        this.db$('delete', { TableName: Tables.ZeusPlatformCode, Key: { type: 'ad', code: inparam.adId } })

        return [0, ret]
    }
}


