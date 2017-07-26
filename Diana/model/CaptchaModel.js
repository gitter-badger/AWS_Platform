import {
    Tables,
    Store$,
    Codes,
    BizErr,
    RoleCodeEnum,
    MSNStatusEnum,
    RoleModels,
    GameTypeEnum,
    Trim,
    Empty,
    Model,
    BillActionEnum,
    Keys,
    Pick,
    Omit
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
        if (!userLoginInfo.captcha) {
            return [BizErr.CaptchaErr(), 0]
        }
        let suffix = 'Platform'
        if (userLoginInfo.suffix) {
            suffix = userLoginInfo.suffix
        }
        const relKey = suffix + '_' + userLoginInfo.username
        const [err, ret] = await this.query({
            KeyConditionExpression: 'relKey = :relKey and #usage = :usage',
            FilterExpression: 'code = :code',
            ExpressionAttributeNames: {
                '#usage': 'usage'
            },
            ExpressionAttributeValues: {
                ':relKey': relKey,
                ':usage': 'login',
                ':code': parseInt(userLoginInfo.captcha)
            }
        })
        if (err) {
            return [BizErr.DBErr(err.toString()), 0]
        } else if (ret.Items.length == 0) {
            return [BizErr.CaptchaErr(), 0]
        } else {
            return [0, ret]
        }
    }
}
