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
    RoleModels
} from '../lib/all'

import { BaseModel } from './BaseModel'

export class LogModel extends BaseModel {
    constructor() {
        super()
        // 设置表名
        this.params = {
            TableName: Tables.ZeusPlatformLog,
        }
        // 设置对象属性
        this.item = {
            ...this.baseitem,
            sn: Model.uuid(),
            userId: Model.StringValue
        }
    }

    /**
     * 分页查询日志
     * @param {*} inparam 
     */
    async logPage(inparam) {
        // 管理员查询
        if (!inparam.parent) {
            return await this.page({
                IndexName: 'LogRoleIndex',
                Limit: inparam.pageSize,
                ExclusiveStartKey: inparam.startKey,
                ScanIndexForward: false,
                KeyConditionExpression: "#role = :role",
                FilterExpression: "#type = :type",
                ExpressionAttributeNames: {
                    '#role': 'role',
                    '#type': 'type'
                },
                ExpressionAttributeValues: {
                    ':role': inparam.role.toString(),
                    ':type': inparam.type
                }
            }, inparam)
        }
        // 线路商查询 
        else {
            return await this.page({
                IndexName: 'LogRoleIndex',
                Limit: inparam.pageSize,
                ExclusiveStartKey: inparam.startKey,
                ScanIndexForward: false,
                KeyConditionExpression: "#role = :role",
                FilterExpression: "#type = :type AND #parent = :parent",
                ExpressionAttributeNames: {
                    '#role': 'role',
                    '#type': 'type',
                    '#parent': 'parent'
                },
                ExpressionAttributeValues: {
                    ':role': inparam.role.toString(),
                    ':type': inparam.type,
                    ':parent': inparam.parent
                }
            }, inparam)
        }
        // let log = { Items: [], LastEvaluatedKey: {} }
        // let [err, ret] = [0, 0]
        // while (log.Items.length < inparam.pageSize && log.LastEvaluatedKey) {
        // [err, ret] = await this.query({
        //     IndexName: 'LogRoleIndex',
        //     Limit: inparam.pageSize,
        //     ExclusiveStartKey: inparam.startKey,
        //     ScanIndexForward: false,
        //     KeyConditionExpression: "#role = :role",
        //     FilterExpression: "#type = :type",
        //     ExpressionAttributeNames: {
        //         '#role': 'role',
        //         '#type': 'type'
        //     },
        //     ExpressionAttributeValues: {
        //         ':role': inparam.role.toString(),
        //         ':type': inparam.type
        //     }
        // })
        //     if (err) {
        //         return [err, 0]
        //     }
        //     // 追加数据
        //     if (log.Items.length > 0) {
        //         log.Items.push(...ret.Items)
        //         log.LastEvaluatedKey = ret.LastEvaluatedKey
        //     } else {
        //         log = ret
        //     }
        //     inparam.startKey = ret.LastEvaluatedKey
        // }
        // return [err, ret]
    }

    /**
     * 添加操作日志
     * @param {*} inparam 
     * @param {*} error 
     * @param {*} result 
     */
    addOperate(inparam, error, result) {
        let userId = inparam.operateToken.userId
        let role = inparam.operateToken.role
        let suffix = inparam.operateToken.suffix
        let username = inparam.operateToken.username
        let lastIP = inparam.lastIP
        let type = 'operate'
        let action = inparam.operateAction
        let inparams = inparam
        let ret = 'Y'
        let detail = result
        if (error) {
            ret = 'N'
            detail = error
        }
        this.putItem({
            ...this.item,
            userId: userId,
            role: role,
            suffix: suffix,
            username: username,
            lastIP: lastIP,
            type: type,
            action: action,
            inparams: inparams,
            ret: ret,
            detail: detail
        }).then((res) => {
        }).catch((err) => {
            console.error(err)
        })
    }

}
