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
     * 用户更新
     * @param {*} userData 
     */
    async userUpdate(userData) {
        const [err, updateRet] = await this.putItem({
            ...userData,
            updatedAt: Model.timeStamp()
        })
        if (err) {
            return [err, 0]
        }
        return [0, updateRet]
    }

    /**
     * 查询用户
     * @param {*} userId 
     * @param {*} role 
     */
    async getUser(userId, role) {
        const [queryErr, queryRet] = await this.query({
            KeyConditionExpression: '#userId = :userId and #role = :role',
            ExpressionAttributeValues: {
                ':role': role,
                ':userId': userId
            },
            ExpressionAttributeNames: {
                '#userId': 'userId',
                '#role': 'role'
            }
        })
        if (queryErr) {
            return [queryErr, 0]
        }
        if (queryRet.Items.length - 1 != 0) {
            return [BizErr.UserNotFoundErr(), 0]
        }
        const User = queryRet.Items[0]
        return [0, User]
    }

    /**
     * 查询管理员详情
     * @param {*} token 
     */
    async theAdmin(token) {
        return await this.getUser(token.userId, token.role)
    }

    /**
     * 查看可用管理员
     */
    async listAvalibleManagers() {
        const [queryErr, queryRet] = await this.query({
            IndexName: 'RoleSuffixIndex',
            KeyConditionExpression: '#role = :role',
            ExpressionAttributeNames: {
                '#role': 'role'
            },
            ExpressionAttributeValues: {
                ':role': RoleCodeEnum['Manager']
            }
        })
        if (queryErr) {
            return [queryErr, 0]
        }
        const viewList = _.map(queryRet.Items, (item) => {
            return {
                value: item.userId,
                label: item.suffix
            }
        })
        return [0, viewList]
    }

    /**
     * 查询管理员列表
     * @param {*} token 
     */
    async listAllAdmins(token) {
        const [queryErr, adminRet] = await this.query({
            KeyConditionExpression: '#role = :role',
            ExpressionAttributeNames: {
                '#role': 'role'
            },
            ExpressionAttributeValues: {
                ':role': RoleCodeEnum['PlatformAdmin']
            }
        })
        if (queryErr) {
            return [queryErr, 0]
        }
        return [0, adminRet.Items]
    }
    /**
     * 通过userId查询用户
     * @param {*} userId 
     */
    async queryUserById(userId) {
        const [err, querySet] = await this.query({
            IndexName: 'UserIdIndex',
            KeyConditionExpression: 'userId = :userId',
            ExpressionAttributeValues: {
                ':userId': userId
            }
        })
        if (err) {
            return [err, 0]
        }
        if (querySet.Items.length - 1 != 0) {
            return [BizErr.UserNotFoundErr(), 0]
        }
        return [0, querySet.Items[0]]
    }

    /**
     * 根据角色，前缀，用户名查询唯一用户
     * @param {*} role 
     * @param {*} suffix 
     * @param {*} username 
     */
    async queryUserBySuffix(role, suffix, username) {
        return await this.query$({
            IndexName: 'RoleSuffixIndex',
            KeyConditionExpression: '#suffix = :suffix and #role = :role',
            FilterExpression: '#username = :username',
            ExpressionAttributeNames: {
                '#role': 'role',
                '#suffix': 'suffix',
                '#username': 'username'
            },
            ExpressionAttributeValues: {
                ':suffix': suffix,
                ':role': role,
                ':username': `${suffix}_${username}`
            }
        })
    }
    /**
     * 查看下级用户
     * @param {*} token 
     * @param {*} roleCode 
     */
    async listChildUsers(token, roleCode) {
        var query = {
            IndexName: 'RoleParentIndex',
            KeyConditionExpression: '#role = :role and parent = :parent',
            ExpressionAttributeNames: {
                '#role': 'role'
            },
            ExpressionAttributeValues: {
                ':parent': token.userId,
                ':role': roleCode
            }
        }
        if (RoleCodeEnum['PlatformAdmin'] === token.role) {
            query = {
                IndexName: 'RoleParentIndex',
                KeyConditionExpression: '#role = :role',
                ExpressionAttributeNames: {
                    '#role': 'role'
                },
                ExpressionAttributeValues: {
                    ':role': roleCode
                }
            }
        }
        const [queryErr, queryRet] = await this.query(query)
        if (queryErr) {
            return [queryErr, 0]
        }
        const users = _.map(queryRet.Items, (item) => {
            return Omit(item, ['passhash'])
        })
        return [0, users]
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
