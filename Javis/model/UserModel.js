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
import _ from 'lodash'
import { BaseModel } from './BaseModel'

export class UserModel extends BaseModel {
    constructor() {
        super()
        // 设置表名
        this.params = {
            TableName: Tables.ZeusPlatformUser,
        }
        // 设置对象属性
        this.item = {
            ...this.baseitem,
            role: Model.StringValue,
            userId: Model.StringValue
        }
    }
    /**
     * 组织架构
     * @param {*} inparam 
     */
    async organize(inparam) {
        // 默认查询平台组织架构（排除平台管理员，代理）
        let [queryErr, queryRet] = await this.scan({
            FilterExpression: '#role <> :role AND #level <> :level',
            ExpressionAttributeNames: {
                '#role': 'role',
                '#level': 'level'
            },
            ExpressionAttributeValues: {
                ':role': RoleCodeEnum['Agent'],
                ':level': 0,
            }
        })
        // 查询代理组织架构
        if (inparam.type == 'agent') {
            [queryErr, queryRet] = await this.query({
                KeyConditionExpression: '#role = :role',
                FilterExpression: '#level <> :level',
                ExpressionAttributeNames: {
                    '#role': 'role',
                    '#level': 'level'
                },
                ExpressionAttributeValues: {
                    ':role': RoleCodeEnum['Agent'],
                    ':level': 0,
                }
            })
        }
        if (queryErr) {
            return [queryErr, 0]
        }
        // 组装组织架构的树状结构
        let organizeTree = []
        let childTree = []
        for (let item of queryRet.Items) {
            // 第一层
            if (item.level == 1) {
                let treeNode = { id: item.userId, parent: item.parent, name: item.displayName, children: [], role: item.role, level: item.level, status: item.status }
                organizeTree.push(treeNode)
            }
            // 剩余节点
            else {
                let treeNode = { id: item.userId, parent: item.parent, name: item.displayName, children: [], role: item.role, level: item.level, status: item.status }
                childTree.push(treeNode)
            }
        }
        tree(organizeTree, childTree)
        return [0, { name: '组织架构', children: organizeTree }]
    }
}
/**
 * 组装树
 * @param {*} treeArray 初始树（第一层）
 * @param {*} array 剩余节点数组
 */
function tree(treeArray, array) {
    // 遍历所有节点
    for (let treeNode of treeArray) {
        let id = treeNode.id
        let children = treeNode.children || []
        // 遍历剩余节点
        for (let j = 0; j < array.length; j++) {
            let item = array[j]
            item.children = []
            // 找到父亲，加入父亲节点，并从剩余节点删除
            if (item.parent == id) {
                children.push(item)
                array.splice(j, 1)
                j--
            }
        }
        // 剩余节点不为0时，递归查询
        if (array.length != 0) {
            tree(children, array)
        }
    }
}
