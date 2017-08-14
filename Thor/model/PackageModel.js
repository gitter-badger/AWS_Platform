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
    PackageStatusEnum
} from '../lib/all'
import _ from 'lodash'
import { BaseModel } from './BaseModel'

export class PackageModel extends BaseModel {
    constructor() {
        super()
        // 设置表名
        this.params = {
            TableName: Tables.DianaPlatformPackage,
        }
        // 设置对象属性
        this.item = {
            ...this.baseitem,
            packageName: Model.StringValue,
            packageId: Model.StringValue
        }
    }

    /**
     * 添加道具包
     * @param {*} inparam 
     */
    async add(inparam) {
        // Start:从编号池获取新编号
        const [uucodeErr, uucodeRet] = await Model.uucode('package', 6)
        if (uucodeErr) { return [uucodeErr, 0] }
        inparam.packageId = uucodeRet

        // 判断是否重复
        const [existErr, exist] = await this.isExist({
            KeyConditionExpression: 'packageName = :packageName',
            ExpressionAttributeValues: {
                ':packageName': inparam.packageName
            }
        })
        if (existErr) {
            return [existErr, 0]
        }
        if (exist) {
            return [BizErr.ItemExistErr('道具包已存在'), 0]
        }
        // 获取所有添加的道具id，组合字符串以便查询
        let contentIds = ''
        for (let tool in inparam.content) {
            contentIds += (tool.id + ',')
        }
        contentIds.substr(0, contentIds.length - 1)
        inparam.contentIds = contentIds
        // 保存
        const dataItem = {
            ...this.item,
            ...inparam
        }
        const [putErr, putRet] = await this.putItem(dataItem)
        if (putErr) {
            return [putErr, 0]
        }
        // End:记录生成的编码
        this.db$('put', { TableName: Tables.ZeusPlatformCode, Item: { type: 'package', code: uucodeRet } })
        return [0, dataItem]
    }

    /**
     * 道具包列表
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
        const sortResult = _.sortBy(ret.Items, ['createdAt'])
        return [0, sortResult]
    }

    /**
     * 更新道具包状态
     * @param {道具包名称} packageName 
     * @param {道具包ID} packageId 
     * @param {需要变更的状态} status 
     */
    async changeStatus(packageName, packageId, status) {
        const [err, ret] = await this.updateItem({
            Key: {
                'packageName': packageName,
                'packageId': packageId
            },
            UpdateExpression: "SET packageStatus = :status",
            ExpressionAttributeValues: {
                ':status': status
            }
        })
        return [err, ret]
    }

    /**
     * 更新道具包
     * @param {道具包对象} inparam 
     */
    async update(inparam) {
        const [err, ret] = await this.getOne(inparam.packageName, inparam.packageId)
        if (err) {
            return [err, 0]
        }
        if (!ret) {
            return [new BizErr.ItemNotExistErr(), 0]
        }
        ret.icon = inparam.icon
        ret.duration = inparam.duration
        ret.remark = inparam.remark
        ret.packageStatus = inparam.packageStatus
        ret.content = inparam.content
        ret.updatedAt = Model.timeStamp()
        return await this.putItem(ret)
    }

    /**
     * 查询单个道具包
     * @param {*} packageName
     * @param {*} packageId
     */
    async getOne(packageName, packageId) {
        const [err, ret] = await this.query({
            KeyConditionExpression: 'packageName = :packageName and packageId = :packageId',
            ExpressionAttributeValues: {
                ':packageName': packageName,
                ':packageId': packageId
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
     * 删除道具包
     * @param {*} inparam
     */
    async delete(inparam) {
        const [err, ret] = await this.deleteItem({
            Key: {
                'packageName': inparam.packageName,
                'packageId': inparam.packageId
            }
        })
        if (err) {
            return [err, 0]
        }
        return [0, ret]
    }
}


