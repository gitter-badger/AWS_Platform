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

export class CaptchaModel extends BaseModel {
    constructor() {
        super()
        // 设置表名
        this.params = {
            TableName: Tables.ZeusPlatformCaptcha,
        }
        // 设置对象属性
        this.item = {
            ...this.baseitem,
            relKey: Model.StringValue,
            code: Model.StringValue
        }
    }
    /**
     * 检查登录验证码
     * @param {*} userLoginInfo 登录信息
     */
    async checkCaptcha(userLoginInfo) {
        // 数据类型转换
        userLoginInfo.captcha = parseInt(userLoginInfo.captcha)
        // 数据校验
        if (!userLoginInfo.captcha) {
            return [BizErr.CaptchaErr(), 0]
        }
        // 完整用户名处理
        let suffix = 'Platform'
        if (userLoginInfo.suffix) {
            suffix = userLoginInfo.suffix
        }
        const relKey = suffix + '_' + userLoginInfo.username
        // 查询验证码
        const [err, ret] = await this.query({
            KeyConditionExpression: 'relKey = :relKey and #usage = :usage',
            FilterExpression: 'code = :code',
            ExpressionAttributeNames: {
                '#usage': 'usage'
            },
            ExpressionAttributeValues: {
                ':relKey': relKey,
                ':usage': 'login',
                ':code': userLoginInfo.captcha
            }
        })
        if (err) {
            return [BizErr.DBErr(err.toString()), 0]
        } else if (ret.Items.length == 0) {
            return [BizErr.CaptchaErr(), 0]
        } else {
            if(Model.timeStamp() - ret.Items[0].createdAt > 30000){
                return [BizErr.CaptchaErr('验证码超时'), 0]
            }
            return [0, ret]
        }
    }
}
