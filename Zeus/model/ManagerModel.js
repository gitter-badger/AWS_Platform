import { Tables, Store$, Codes, BizErr, Model, StatusEnum, RoleCodeEnum, RoleModels } from '../lib/all'
import _ from 'lodash'
import { BaseModel } from './BaseModel'
export class ManagerModel extends BaseModel {
    constructor() {
        super()
        // 设置表名
        this.params = {
            TableName: Tables.ZeusPlatformUser,
        }
        // 设置对象属性
        this.item = {
            ...this.baseitem
        }
    }

    /**
     * 线路商列表页
     * @param {*} token 
     * @param {*} inparam 
     */
    async page(token, inparam) {
        let query = {
            IndexName: 'RoleParentIndex',
            KeyConditionExpression: '#role = :role and parent = :parent',
            ExpressionAttributeNames: {
                '#role': 'role'
            },
            ExpressionAttributeValues: {
                ':parent': token.userId,
                ':role': RoleCodeEnum.Manager
            }
        }
        if (Model.isPlatformAdmin(token)) {
            query = {
                IndexName: 'RoleParentIndex',
                KeyConditionExpression: '#role = :role',
                ExpressionAttributeNames: {
                    '#role': 'role'
                },
                ExpressionAttributeValues: {
                    ':role': RoleCodeEnum.Manager
                }
            }
        }
        // 条件搜索
        const [queryErr, queryRet] = await this.bindFilterQuery(query, inparam.query, true)
        // 去除敏感数据
        const users = _.map(queryRet.Items, (item) => {
            item.passhash = null
            if (!Model.isPlatformAdmin(token)) {
                item.password = '********'
            }
            return item
        })
        // 排序输出
        let sortResult = _.sortBy(users, [inparam.sortkey || 'level'])
        if (inparam.sort == "desc") { sortResult = sortResult.reverse() }
        return [0, sortResult]
    }
}
