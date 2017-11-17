import { Tables, Store$, Codes, BizErr, Empty, Model, Keys, Pick, Omit, StatusEnum, RoleCodeEnum, RoleModels } from '../lib/all'
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
     * 获取所有用户
     * @param {*} inparam 
     */
    async fetch(inparam) {
        let query = {
            ProjectionExpression: 'userId,suffix,uname,username,displayName,#role,#level,levelIndex,parent,parentName,parentRole',
            ExpressionAttributeNames: {
                '#role': 'role',
                '#level': 'level',
            }
        }
        const [queryErr, queryRet] = await this.scan(query)
        if (queryErr) {
            return [queryErr, 0]
        }
        return [0, queryRet.Items]
    }
}
