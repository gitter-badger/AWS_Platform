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
            toolId: Model.StringValue
        }
    }

    /**
     * 添加道具
     * @param {*} inparam 
     */
    async addTool(inparam) {
        // Start:从编号池获取新编号
        let [uucodeErr, uucodeRet] = await Model.uucode('tool', 6)
        if (uucodeErr) { return [uucodeErr, 0] }
        // 数据类型处理
        inparam.toolStatus = ToolStatusEnum.Enable
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
        // 保存
        const item = {
            ...this.item,
            ...inparam
        }
        const [putErr, putRet] = await this.putItem(item)
        if (putErr) {
            return [putErr, 0]
        }
        // End:记录生成的编码
        this.db$('put', { TableName: Tables.ZeusPlatformCode, Item: { type: 'tool', code: uucodeRet } })
        return [0, item]
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
        return [0, ret.Items]
    }

    /**
     * 更新道具状态
     * @param {道具} toolName 
     * @param {道具ID} toolId 
     * @param {需要变更的状态} status 
     */
    changeStatus(toolName, toolId, status) {
        return new Promise((reslove, reject) => {
            const params = {
                ...this.params,
                Key: {
                    'toolName': toolName,
                    'toolId': toolId
                },
                UpdateExpression: "SET toolStatus = :status",
                ExpressionAttributeValues: {
                    ':status': status
                }
            }
            this.db$('update', params)
                .then((res) => {
                    return reslove([0, res])
                }).catch((err) => {
                    return reslove([BizErr.DBErr(err.toString()), 0])
                })
        })
    }

    /**
     * 查询单个道具
     * @param {*} toolName
     * @param {*} toolId
     */
    getOne(toolName, toolId) {
        return new Promise((reslove, reject) => {
            const params = {
                ...this.params,
                KeyConditionExpression: 'toolName = :toolName and toolId = :toolId',
                ExpressionAttributeValues: {
                    ':toolName': toolName,
                    ':toolId': toolId
                }
            }
            this.db$('query', params)
                .then((res) => {
                    if(res.Items.length > 0){
                        res = res.Items[0]
                    }
                    return reslove([0, res])
                }).catch((err) => {
                    return reslove([BizErr.DBErr(err.toString()), false])
                })
        })
    }
}


