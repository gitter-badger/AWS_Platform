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
    ToolStatusEnum
} from '../lib/all'
import _ from 'lodash'
import { BaseModel } from './BaseModel'

export class ToolModel extends BaseModel {
    constructor() {
        super()
        // 设置表名
        this.params = {
            TableName: Tables.DianaPlatformTool,
        }
        // 设置对象属性
        this.item = {
            ...this.baseitem,
            toolName: Model.StringValue,
            toolId: Model.StringValue
        }
    }

    /**
     * 添加道具
     * @param {*} inparam 
     */
    async addTool(inparam) {
        // Start:从编号池获取新编号
        const [uucodeErr, uucodeRet] = await Model.uucode('tool', 6)
        if (uucodeErr) { return [uucodeErr, 0] }
        inparam.toolId = uucodeRet

        // 判断是否重复
        const [existErr, exist] = await this.isExist({
            KeyConditionExpression: 'toolName = :toolName',
            ExpressionAttributeValues: {
                ':toolName': inparam.toolName
            }
        })
        if (existErr) {
            return [existErr, 0]
        }
        if (exist) {
            return [BizErr.ItemExistErr('道具已存在'), 0]
        }
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
        this.db$('put', { TableName: Tables.ZeusPlatformCode, Item: { type: 'tool', code: uucodeRet } })
        return [0, dataItem]
    }

    /**
     * 道具列表
     * @param {*} inparams
     */
    async list(inparams) {
        inparams = { toolName: null, toolStatus: 1 }
        let ranges = Model.getInparamRanges(inparams)
        let values = Model.getInparamValues(inparams)
        // 组装条件
        // let ranges = _.map(inparams, (v, i) => {
        //     if (v === null) {
        //         return null
        //     }
        //     if (i == 'toolName') {
        //         return `contains(${i}, :${i})`
        //     } else {
        //         return `${i} = :${i}`
        //     }
        // })
        // _.remove(ranges, (v) => v === null)
        // ranges = _.join(ranges, ' AND ')
        // 组装条件值
        // const values = _.reduce(inparams, (result, v, i) => {
        //     if (v !== null) {
        //         result[`:${i}`] = v
        //     }
        //     return result
        // }, {})
        console.info(ranges)
        console.info(values)
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
     * 更新道具状态
     * @param {道具} toolName 
     * @param {道具ID} toolId 
     * @param {需要变更的状态} status 
     */
    async changeStatus(toolName, toolId, status) {
        const [err, ret] = await this.updateItem({
            Key: {
                'toolName': toolName,
                'toolId': toolId
            },
            UpdateExpression: "SET toolStatus = :status",
            ExpressionAttributeValues: {
                ':status': status
            }
        })
        return [err, ret]
    }

    /**
     * 更新道具
     * @param {道具对象} inparam 
     */
    async updateTool(inparam) {
        // 更新
        const [err, ret] = await this.getOne(inparam.toolName, inparam.toolId)
        if (err) {
            return [err, 0]
        }
        if (!ret) {
            return [new BizErr.ItemNotExistErr(), 0]
        }
        ret.icon = inparam.icon
        ret.desc = inparam.desc
        ret.remark = inparam.remark
        ret.toolStatus = inparam.toolStatus
        ret.updatedAt = Model.timeStamp()
        return await this.putItem(ret)
    }

    /**
     * 查询单个道具
     * @param {*} toolName
     * @param {*} toolId
     */
    async getOne(toolName, toolId) {
        const [err, ret] = await this.query({
            KeyConditionExpression: 'toolName = :toolName and toolId = :toolId',
            ExpressionAttributeValues: {
                ':toolName': toolName,
                ':toolId': toolId
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
     * 删除
     * @param {*} inparam
     */
    async delete(inparam) {
        const [err, ret] = await this.deleteItem({
            Key: {
                'toolName':inparam.toolName,
                'toolId': inparam.toolId
            }
        })
        if (err) {
            return [err, 0]
        }
        return [0, ret]
    }
}

