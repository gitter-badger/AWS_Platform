import { Tables, Codes, BizErr, Trim, Empty, Model, Keys, Pick, Omit, RoleCodeEnum, RoleModels } from '../lib/all'
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
        // 根据userId查询TOKEN
        const [err, ret] = await this.query({
            KeyConditionExpression: 'userId = :userId',
            ExpressionAttributeValues: {
                ':userId': inparam.userId
            }
        })
        if (err) {
            return [err, 0]
        }
        // 存在，则判断是否过期
        if (ret.Items.length > 0) {
            // 超过600秒过期
            if (Math.floor((new Date().getTime() / 1000)) - ret.Items[0].iat > 600) {
                // 删除TOKEN
                this.deleteItem({Key: {'userId': inparam.userId}})
                return [BizErr.TokenExpire(), 0]
            }
            // 更新过期时间
            else {
                ret.Items[0].iat = Math.floor(Date.now() / 1000) - 30
                const [putErr, putRet] = await this.putItem(ret.Items[0])
                if (putErr) {
                    return [putErr, 0]
                }
            }
        }
        // 保存新的TOKEN
        else {
            const [putErr, putRet] = await this.putItem(inparam)
            if (putErr) {
                return [putErr, 0]
            }
        }
        return [0, inparam]
    }
}


