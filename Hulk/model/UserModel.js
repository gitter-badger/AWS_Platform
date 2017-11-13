import { Tables, Store$, Codes, BizErr, Trim, Empty, Model, Keys, Pick, Omit, StatusEnum, RoleCodeEnum, RoleModels } from '../lib/all'
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
     * 查看可用代理
     */
    async listAvailableAgents(token, inparam) {
        // 查询所有可用代理
        const allAgent = {
            IndexName: 'RoleSuffixIndex',
            KeyConditionExpression: '#role = :role',
            FilterExpression: '#status = :status AND #level <> :level',
            ExpressionAttributeNames: {
                '#role': 'role',
                '#status': 'status',
                '#level': 'level'
            },
            ExpressionAttributeValues: {
                ':role': RoleCodeEnum['Agent'],
                ':status': StatusEnum.Enable,
                ':level': 0
            }
        }
        // 查询用户的所有可用代理
        const childAgent = {
            IndexName: 'RoleSuffixIndex',
            KeyConditionExpression: '#role = :role',
            FilterExpression: '#status = :status AND contains(#levelIndex,:levelIndex)',
            ExpressionAttributeNames: {
                '#role': 'role',
                '#status': 'status',
                '#levelIndex': 'levelIndex'
            },
            ExpressionAttributeValues: {
                ':role': RoleCodeEnum['Agent'],
                ':status': StatusEnum.Enable,
                ':levelIndex': inparam.parent
            }
        }
        let [queryErr, queryRet] = [1, 1]
        if (!inparam.parent) {
            [queryErr, queryRet] = await this.query(allAgent)
        }
        else {
            [queryErr, queryRet] = await this.query(childAgent)
        }

        if (queryErr) {
            return [queryErr, 0]
        }
        // 去除敏感数据
        queryRet.Items = _.map(queryRet.Items, (item) => {
            item.passhash = null
            if (!inparam.parent) {
                item.password = '********'
            }
            return item
        })
        // 按照层级排序
        const sortResult = _.sortBy(queryRet.Items, ['level'])
        return [0, sortResult]
    }

    // 检查代理用户是否重复
    async checkUserBySuffix(role, suffix, username) {
        let [err, ret] = [0, 0]
        // 对于代理管理员来说。 可以允许suffix相同，所以需要角色，前缀，用户名联合查询
        // if (suffix == 'Agent') {
        //     [err, ret] = await this.queryUserBySuffix(role, suffix, username)
        // } else {
        //     // 对于其他用户，角色和前缀具有联合唯一性
        //     [err, ret] = await this.query({
        //         TableName: Tables.ZeusPlatformUser,
        //         IndexName: 'RoleSuffixIndex',
        //         KeyConditionExpression: '#suffix = :suffix and #role = :role',
        //         ExpressionAttributeNames: {
        //             '#role': 'role',
        //             '#suffix': 'suffix'
        //         },
        //         ExpressionAttributeValues: {
        //             ':suffix': suffix,
        //             ':role': role
        //         }
        //     })
        // }
        // if (err) {
        //     return [err, 0]
        // }
        // 还需要校验角色和用户名的唯一性
        // if (suffix != 'Agent' && ret.Items.length == 0) {
            [err, ret] = await this.query({
                TableName: Tables.ZeusPlatformUser,
                IndexName: 'RoleUsernameIndex',
                KeyConditionExpression: '#username = :username and #role = :role',
                ExpressionAttributeNames: {
                    '#role': 'role',
                    '#username': 'username'
                },
                ExpressionAttributeValues: {
                    ':username': username,
                    ':role': role
                }
            })
        // }
        if (ret.Items.length > 0) {
            return [0, false]
        } else {
            return [0, true]
        }
    }

    // 检查昵称是否重复
    async checkNickExist(role, displayName) {
        let [err, ret] = await this.query({
            TableName: Tables.ZeusPlatformUser,
            IndexName: 'RoleSuffixIndex',
            KeyConditionExpression: '#role = :role',
            FilterExpression: '#displayName = :displayName',
            ExpressionAttributeNames: {
                '#role': 'role',
                '#displayName': 'displayName'
            },
            ExpressionAttributeValues: {
                ':role': role,
                ':displayName': displayName
            }
        })

        if (err) {
            return [err, 0]
        }
        if (ret.Items.length > 0) {
            return [0, false]
        } else {
            return [0, true]
        }
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
        return await this.query({
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

    /**
     * 检查有效期
     * @param {*} user 登录信息
     */
    async checkContractPeriod(user) {
        // 不是代理管理员，需要检查有效期
        if (!Model.isAgentAdmin(user)) {
            // 如果存在有效期
            if (user.contractPeriod && user.contractPeriod.length == 2) {
                const start = user.contractPeriod[0]
                const end = user.contractPeriod[1]
                const now = new Date().getTime()
                console.info('起始时间：' + start)
                console.info('结束时间：' + end)
                console.info('当前时间：' + now)
                // 帐号未生效
                if (start > now) {
                    return [BizErr.MerchantPeriodStartErr(), 0]
                }
                // 过期则冻结帐号
                if (now > end) {
                    const [err, ret] = await this.changeStatus(user.role, user.userId, StatusEnum.Disable)
                    if (err) {
                        return [BizErr.DBErr(err.toString()), 0]
                    }
                    return [BizErr.MerchantPeriodEndErr(), 0]
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
    async changeStatus(role, userId, status) {
        const [err, ret] = await this.updateItem({
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
        })
        return [err, ret]
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
     * 查看所有下级用户
     * @param {*} token 
     */
    async listAllChildUsers(token) {
        let query = {
            FilterExpression: 'contains(#levelIndex,:levelIndex)',
            ExpressionAttributeNames: {
                '#levelIndex': 'levelIndex'
            },
            ExpressionAttributeValues: {
                ':levelIndex': token.userId
            }
        }
        const [queryErr, queryRet] = await this.scan(query)
        if (queryErr) {
            return [queryErr, 0]
        }
        // 去除敏感数据（该方法不需要）
        // queryRet.Items = _.map(queryRet.Items, (item) => {
        //     item.passhash = null
        //     if (!Model.isPlatformAdmin(token)) {
        //         item.password = '********'
        //     }
        //     return item
        // })
        // 按照层级排序
        // const sortResult = _.sortBy(queryRet.Items, ['level'])
        return [0, queryRet.Items]
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
