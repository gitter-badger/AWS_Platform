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
    StatusEnum,
    RoleCodeEnum,
    RoleModels
} from '../lib/all'

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
     * 根据用户ID查询
     * @param {*} userId 用户ID 
     */
    async queryUserById(userId) {
        const [err, ret] = await this.query({
            IndexName: 'UserIdIndex',
            KeyConditionExpression: 'userId = :userId',
            ExpressionAttributeValues: {
                ':userId': userId
            }
        })
        if (err) {
            return [err, 0]
        }
        if (ret.Items.length - 1 != 0) {
            return [BizErr.UserNotFoundErr(), 0]
        }
        return [0, ret.Items[0]]
    }

    /**
     * 根据角色和带前缀的用户名查询唯一用户
     * @param {*} role 
     * @param {*} username 
     */
    async getUserByName(role, username) {
        const [queryErr, queryRet] = await this.query({
            IndexName: 'RoleUsernameIndex',
            KeyConditionExpression: '#role = :role and #username = :username',
            ExpressionAttributeNames: {
                '#username': 'username',
                '#role': 'role'
            },
            ExpressionAttributeValues: {
                ':username': username,
                ':role': role
            }
        })
        if (queryErr) {
            return [queryErr, 0]
        }
        const User = queryRet.Items[0]
        if (!User) {
            return [BizErr.UserNotFoundErr(), 0]
        }
        return [0, User]
    }

    // const params = {
    //     ...this.params,
    //     Key: {
    //         'role': '100',
    //         'userId': '25f76130-e04b-4b9f-9a20-1836a75fe419'
    //     },
    //     UpdateExpression: "SET contractPeriod = :contractPeriod",
    //     ExpressionAttributeValues: {
    //         ':contractPeriod': [new Date().getTime() - 10000000, new Date().getTime() + 10000000]
    //     }
    // }
    // await this.db$('update', params)
}
