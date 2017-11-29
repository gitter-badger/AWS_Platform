import { Tables, Store$, Codes, BizErr, Model, RoleCodeEnum, RoleModels } from '../lib/all'
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
        let finalRet = {}
        if (inparam.type == 'admin') {
            // 默认查询平台组织架构（排除平台管理员，代理）
            let platfromQuery = {
                FilterExpression: '#role <> :role AND #level <> :level',
                ExpressionAttributeNames: {
                    '#role': 'role',
                    '#level': 'level'
                },
                ExpressionAttributeValues: {
                    ':role': RoleCodeEnum['Agent'],
                    ':level': 0,
                }
            }
            // 平台非管理员
            if (!Model.isPlatformAdmin(inparam.token)) {
                platfromQuery = {
                    FilterExpression: '#role <> :role AND #level <> :level AND contains(#levelIndex,:levelIndex)',
                    ExpressionAttributeNames: {
                        '#role': 'role',
                        '#level': 'level',
                        '#levelIndex': 'levelIndex'
                    },
                    ExpressionAttributeValues: {
                        ':role': RoleCodeEnum['Agent'],
                        ':level': 0,
                        ':levelIndex': inparam.token.userId
                    }
                }
            }
            let [queryErr, queryRet] = await this.scan(platfromQuery)
            if (queryErr) { return [queryErr, 0] }
            finalRet = queryRet
        }
        // 查询代理组织架构
        if (inparam.type == 'agent') {
            let agentQuery = {
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
            }
            // 代理非管理员
            if (!Model.isAgentAdmin(inparam.token)) {
                agentQuery = {
                    KeyConditionExpression: '#role = :role',
                    FilterExpression: '#level <> :level AND contains(#levelIndex,:levelIndex)',
                    ExpressionAttributeNames: {
                        '#role': 'role',
                        '#level': 'level',
                        '#levelIndex': 'levelIndex'
                    },
                    ExpressionAttributeValues: {
                        ':role': RoleCodeEnum['Agent'],
                        ':level': 0,
                        ':levelIndex': inparam.token.userId
                    }
                }
            }
            let [queryErr, queryRet] = await this.query(agentQuery)
            if (queryErr) { return [queryErr, 0] }
            finalRet = queryRet
        }

        // 组装组织架构的树状结构
        let organizeTree = []
        let childTree = []
        for (let item of finalRet.Items) {
            // 第一层
            if (item.level == parseInt(inparam.token.level) + 1) {
                let treeNode = { id: item.userId, parent: item.parent, name: item.displayName, username: item.username, children: [], role: item.role, level: item.level, status: item.status }
                organizeTree.push(treeNode)
            }
            // 剩余节点
            else {
                let treeNode = { id: item.userId, parent: item.parent, name: item.displayName, username: item.username, children: [], role: item.role, level: item.level, status: item.status }
                childTree.push(treeNode)
            }
        }
        tree(organizeTree, childTree)
        // 优化显示直属线路商和直属商户
        let topName = 'NA集团'
        if (!Model.isPlatformAdmin(inparam.token)) {
            topName = inparam.token.displayName
        }
        organizeTree = { id: '01', name: topName, children: organizeTree }
        if (inparam.type == 'admin' && Model.isPlatformAdmin(inparam.token)) {
            const directManagerNode = { name: '直属线路商', children: [] }
            const directMerchantNode = { name: '直属商户', children: [] }
            for (let directNode of organizeTree.children) {
                if (directNode.role == RoleCodeEnum.Manager) {
                    directManagerNode.children.push(directNode)
                } else if (directNode.role == RoleCodeEnum.Merchant) {
                    directMerchantNode.children.push(directNode)
                }
            }
            organizeTree.children = [directManagerNode, directMerchantNode]
        }
        return [0, organizeTree]
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
