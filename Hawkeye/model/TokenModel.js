import { Tables, Codes, BizErr, Model, RoleCodeEnum, RoleModels } from '../lib/all'
import _ from 'lodash'
import { BaseModel } from './BaseModel'

export class TokenModel extends BaseModel {
    constructor() {
        super()
        // 设置表名
        this.params = {
            TableName: Tables.SYSToken,
        }
        // 设置对象属性
        this.item = {
            ...this.baseitem,
            userId: Model.StringValue
        }
    }

    /**
     * 检查TOKEN是否过期，未过期自动更新过期时间
     * @param {*} inparam 
     */
    async checkExpire(inparam) {
        // 判断TOKEN是否太新（小于1小时）
        if (Math.floor((new Date().getTime() / 1000)) - inparam.iat < 3600) {
            return [0, inparam]
        }
        // 判断TOKEN是否太老（大于24小时）
        if (Math.floor((new Date().getTime() / 1000)) - inparam.iat > 86400) {
            return [BizErr.TokenExpire(), 0]
        }
        // 根据userId查询TOKEN
        const [err, ret] = await this.query({
            KeyConditionExpression: 'userId = :userId',
            ExpressionAttributeValues: {
                ':userId': inparam.userId
            }
        })
        // 存在，则判断是否过期
        if (ret.Items.length > 0) {
            // 超过2小时过期
            if (Math.floor((new Date().getTime() / 1000)) - ret.Items[0].iat > 7200) {
                return [BizErr.TokenExpire(), 0]
            }
            // 更新过期时间
            else {
                ret.Items[0].iat = Math.floor(Date.now() / 1000) - 30
                const [putErr, putRet] = await this.putItem(ret.Items[0])
            }
        }
        // 不存在，返回错误
        else {
            return [BizErr.TokenErr(), 0]
        }
        return [0, inparam]
    }
}


