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
     * 查询平台用户统计
     */
    async queryOne(inparam) {
        let query = {
            IndexName: 'UserIdIndex',
            ProjectionExpression: 'userId,suffix,uname,username,displayName,#role,#level,levelIndex,parent,parentName,parentRole,createdAt,updatedAt,rate,vedioMix,liveMix',
            KeyConditionExpression: 'userId = :userId',
            ExpressionAttributeNames: {
                '#role': 'role',
                '#level': 'level'
            },
            ExpressionAttributeValues: {
                ':userId': inparam.userId
            }
        }
        const [queryErr, queryRet] = await this.query(query)
        if (queryErr) {
            return [queryErr, 0]
        }
        const User = queryRet.Items[0]
        if (!User) {
            return [BizErr.UserNotFoundErr(), 0]
        }
        return [0, User]
    }
    /**
     * 查询下级平台用户统计
     */
    async queryChild(inparam) {
        // 查询代理
        if (Model.isAgent(inparam.token)) {
            let query = {
                IndexName: 'RoleParentIndex',
                ProjectionExpression: 'userId,suffix,uname,username,displayName,#role,#level,levelIndex,parent,parentName,parentRole,createdAt,updatedAt,rate,vedioMix,liveMix',
                KeyConditionExpression: '#role=:role AND #parent=:parent',
                ExpressionAttributeNames: {
                    '#role': 'role',
                    '#parent': 'parent',
                    '#level': 'level'
                },
                ExpressionAttributeValues: {
                    ':role': inparam.token.role,
                    ':parent': inparam.parent
                }
            }
            // 条件搜索
            if (!_.isEmpty(inparam.query)) {
                const queryParams = this.buildQueryParams(inparam.query, true)
                query.FilterExpression = queryParams.FilterExpression
                query.ExpressionAttributeNames = { ...query.ExpressionAttributeNames, ...queryParams.ExpressionAttributeNames }
                query.ExpressionAttributeValues = { ...query.ExpressionAttributeValues, ...queryParams.ExpressionAttributeValues }
            }
            const [queryErr, queryRet] = await this.query(query)
            if (queryErr) {
                return [queryErr, 0]
            }
            // 排序输出
            let sortResult = _.sortBy(queryRet.Items, [inparam.sortkey || 'createdAt'])
            if (inparam.sort == "desc") { sortResult = sortResult.reverse() }
            return [0, sortResult]
        }
        // 查询平台 
        else {
            let query = {
                ProjectionExpression: 'userId,suffix,uname,username,displayName,#role,#level,levelIndex,parent,parentName,parentRole,createdAt,updatedAt,rate,vedioMix,liveMix',
                FilterExpression: '(#role=:role10 OR #role=:role100) AND #parent=:parent',
                ExpressionAttributeNames: {
                    '#role': 'role',
                    '#parent': 'parent',
                    '#level': 'level'
                },
                ExpressionAttributeValues: {
                    ':role10': '10',
                    ':role100': '100',
                    ':parent': inparam.parent
                }
            }
            // 条件搜索
            if (!_.isEmpty(inparam.query)) {
                const queryParams = this.buildQueryParams(inparam.query, true)
                query.FilterExpression += (' AND ' + queryParams.FilterExpression)
                query.ExpressionAttributeNames = { ...query.ExpressionAttributeNames, ...queryParams.ExpressionAttributeNames }
                query.ExpressionAttributeValues = { ...query.ExpressionAttributeValues, ...queryParams.ExpressionAttributeValues }
            }
            const [queryErr, queryRet] = await this.scan(query)
            // 排序输出
            let sortResult = _.sortBy(queryRet.Items, [inparam.sortkey || 'createdAt'])
            if (inparam.sort == "desc") { sortResult = sortResult.reverse() }
            return [0, sortResult]
        }
    }

    /**
     * 查询玩家统计
     */
    async queryChildPlayer(inparam) {
        let query = {
            TableName: Tables.HeraGamePlayer,
            IndexName: 'parentIdIndex',
            KeyConditionExpression: 'parent = :parentId',
            ExpressionAttributeValues: {
                ':parentId': inparam.parentId
            }
        }
        // 条件搜索
        if (!_.isEmpty(inparam.query)) {
            const queryParams = this.buildQueryParams(inparam.query, true)
            query.FilterExpression = queryParams.FilterExpression
            query.ExpressionAttributeNames = { ...query.ExpressionAttributeNames, ...queryParams.ExpressionAttributeNames }
            query.ExpressionAttributeValues = { ...query.ExpressionAttributeValues, ...queryParams.ExpressionAttributeValues }
        }
        const [queryErr, queryRet] = await this.query(query)
        if (queryErr) {
            return [queryErr, 0]
        }
        // 排序输出
        let sortResult = _.sortBy(queryRet.Items, [inparam.sortkey || 'createdAt'])
        if (inparam.sort == "desc") { sortResult = sortResult.reverse() }
        return [0, sortResult]
    }
}
