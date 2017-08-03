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
    constructor(uucode) {
        super()
        // 设置表名
        this.params = {
            TableName: Tables.DianaPlatformTool,
        }
        // 设置对象属性
        this.item = {
            ...this.baseitem,
            toolName: Model.StringValue,
            toolId: Model.StringValue,
            order: Model.NumberValue
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
        // 数据类型处理
        inparam.toolStatus = ToolStatusEnum.Enable
        inparam.toolId = uucodeRet
        inparam.remark = inparam.remark || Model.StringValue
        inparam.order = inparam.order || Model.NumberValue
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
        const [err, ret] = await this.scan({
        })
        if (err) {
            return [err, 0]
        }
        const sortResult = _.sortBy(ret.Items, ['order'])
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
        const [err, ret] = await this.getOne(inparam.toolName, inparam.toolId)
        if (err) {
            return [err, 0]
        }
        if (!ret) {
            return [new BizErr.ItemNotExistErr(), 0]
        }
        ret.price = inparam.price
        ret.num = inparam.num
        ret.toolStatus = inparam.status
        ret.updatedAt = Model.timeStamp()
        ret.order = parseInt(inparam.order)
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
}


