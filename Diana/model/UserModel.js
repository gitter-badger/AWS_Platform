import {
    Tables,
    Store$,
    Codes,
    BizErr,
    StatusEnum,
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
     * 检查有效期
     * @param {*} user 登录信息
     */
    async checkContractPeriod(user) {
        // 不是平台管理员，需要检查有效期
        if (!user.role != RoleCodeEnum['PlatformAdmin']) {
            // 如果存在有效期
            if (user.contractPeriod && user.contractPeriod.length == 2) {
                const start = user.contractPeriod[0]
                const end = user.contractPeriod[1]
                const now = new Date().getTime()
                console.info('起始时间：' + start)
                console.info('结束时间：' + end)
                console.info('当前时间：' + now)
                // 过期则冻结帐号
                if (start > now || now > end) {
                    const [err, ret] = await this.changeStatus(user.role, user.userId, StatusEnum.Disable)
                    if (err) {
                        return [BizErr.DBErr(err.toString()), 0]
                    }
                    return [BizErr.MerchantPeriodErr(), 0]
                }
            } else {
                console.info('有效期永久')
            }
        }
        return [0, true]
    }

    /**
     * 更新用户状态
     * @param {用户角色} role 
     * @param {用户ID} userId 
     * @param {需要变更的状态} status 
     */
    changeStatus(role, userId, status) {
        return new Promise((reslove, reject) => {
            const params = {
                ...this.params,
                Key: {
                    'role': role,
                    'userId': userId
                },
                UpdateExpression: "SET #status = :status",
                ExpressionAttributeNames: {
                    '#status': 'status'
                },
                ExpressionAttributeValues: {
                    ':status': status
                }
            }
            this.db$('update', params)
                .then((res) => {
                    return reslove([0, res])
                }).catch((err) => {
                    return reslove([BizErr.DBErr(err.toString()), 0])
                })
        })
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
