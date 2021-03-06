import { Tables, Codes, BizErr, Model, RoleCodeEnum, RoleModels } from '../lib/all'
import _ from 'lodash'
import { BaseModel } from './BaseModel'
import { PackageModel } from './PackageModel'
import { SeatModel } from './SeatModel'

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
        // 判断是否重复
        const [existErr, exist] = await this.isExist({
            KeyConditionExpression: 'toolName = :toolName',
            ExpressionAttributeValues: {
                ':toolName': inparam.toolName
            }
        })
        if (exist) {
            return [BizErr.ItemExistErr('道具已存在'), 0]
        }

        // Start:从编号池获取新编号
        if (inparam.toolName == 'N币') {
            inparam.toolId = '100000'
        } else if (inparam.toolName == '房卡') {
            inparam.toolId = '200000'
        }
        else {
            const [uucodeErr, uucodeRet] = await Model.uucode('tool', 6)
            if (uucodeErr) { return [uucodeErr, 0] }
            inparam.toolId = uucodeRet
        }

        const dataItem = {
            ...this.item,
            ...inparam
        }
        // 保存
        const [putErr, putRet] = await this.putItem(dataItem)
        // End:记录生成的编码
        this.db$('put', { TableName: Tables.ZeusPlatformCode, Item: { type: 'tool', code: inparam.toolId } })
        return [0, dataItem]
    }

    /**
     * 道具列表
     * @param {*} inparam
     */
    async list(inparam) {
        // 条件搜索
        let query = {}
        if (!_.isEmpty(inparam.query)) {
            if (inparam.query.toolId) { inparam.query.toolId = { $like: inparam.query.toolId } }
            if (inparam.query.toolName) { inparam.query.toolName = { $like: inparam.query.toolName } }
        }
        // 查询
        const [err, ret] = await this.bindFilterScan(query, inparam.query, false)
        const sortResult = _.sortBy(ret.Items, ['createdAt'])
        return [0, sortResult]
    }

    /**
     * 设置道具价格
     */
    async setPrice(inparam) {
        let updateObj = {
            Key: { 'toolName': inparam.toolName, 'toolId': inparam.toolId },
            UpdateExpression: 'SET toolPrice=:toolPrice ,comeUpRatio=:comeUpRatio,lowerRatio=:lowerRatio,#status=:status',
            ExpressionAttributeNames: {
                '#status': 'status'
            },
            ExpressionAttributeValues: {
                ':toolPrice': inparam.toolPrice,
                ':comeUpRatio': inparam.comeUpRatio,
                ':lowerRatio': inparam.lowerRatio,
                ':status': inparam.status
            }
        }
        const [err, ret] = await this.updateItem(updateObj)
        return [0, ret]
    }
    /**
     * 查询单个道具
     * @param {*} inparam
     */
    async getOne(inparam) {
        const [err, ret] = await this.query({
            KeyConditionExpression: 'toolName = :toolName and toolId = :toolId',
            ExpressionAttributeValues: {
                ':toolName': inparam.toolName,
                ':toolId': inparam.toolId
            }
        })
        if (ret.Items.length > 0) {
            return [0, ret.Items[0]]
        } else {
            return [0, 0]
        }
    }

    /**
     * 更新道具状态
     * @param {} inparam 
     */
    async changeStatus(inparam) {
        // 检查是否可以变更状态
        let [err, ret] = await new PackageModel().findIdsContains(inparam.toolId)
        if (ret) {
            return [BizErr.ItemUsed('道具在礼包中，不可变更'), 0]
        }
        [err, ret] = await new SeatModel().findIdsContains('tool_' + inparam.toolId)
        if (ret) {
            return [BizErr.ItemUsed('道具在展位中，不可变更'), 0]
        }
        // 变更状态
        [err, ret] = await this.updateItem({
            Key: {
                'toolName': inparam.toolName,
                'toolId': inparam.toolId
            },
            UpdateExpression: "SET toolStatus = :status",
            ExpressionAttributeValues: {
                ':status': inparam.status
            }
        })
        return [err, ret]
    }

    /**
     * 更新道具
     * @param {道具对象} inparam 
     */
    async updateTool(inparam) {
        // 检查是否可以更新
        // let [err, ret] = await new PackageModel().findIdsContains(inparam.toolId)
        // if (ret) {
        //     return [BizErr.ItemUsed('道具在礼包中，不可变更'), 0]
        // }
        // [err, ret] = await new SeatModel().findIdsContains('tool_' + inparam.toolId)
        // if (ret) {
        //     return [BizErr.ItemUsed('道具在展位中，不可变更'), 0]
        // }
        // 更新
        let [err, ret] = await this.getOne(inparam)
        if (!ret) {
            return [new BizErr.ItemNotExistErr(), 0]
        }
        ret.icon = inparam.icon
        ret.desc = inparam.desc
        ret.remark = inparam.remark
        // ret.toolStatus = inparam.toolStatus
        ret.updatedAt = Model.timeStamp()
        return await this.putItem(ret)
    }

    /**
     * 删除
     * @param {*} inparam
     */
    async delete(inparam) {
        // 检查是否可以删除
        let [err1, ret1] = await new PackageModel().findIdsContains(inparam.toolId)
        if (ret1) {
            return [BizErr.ItemUsed('道具在礼包中，不可删除'), 0]
        }
        let [err2, ret2] = await new SeatModel().findIdsContains('tool_' + inparam.toolId)
        if (ret2) {
            return [BizErr.ItemUsed('道具在展位中，不可删除'), 0]
        }
        // 删除
        let [err3, ret3] = await this.deleteItem({
            Key: {
                'toolName': inparam.toolName,
                'toolId': inparam.toolId
            }
        })

        // End:删除生成的编码
        this.db$('delete', { TableName: Tables.ZeusPlatformCode, Key: { type: 'tool', code: inparam.toolId } })

        return [0, ret3]
    }
}


