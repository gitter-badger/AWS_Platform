import { Tables, Store$, Codes, BizErr, Trim, Empty, Model, Keys, Pick, Omit, RoleCodeEnum, RoleModels, BillMo } from '../lib/all'
import _ from 'lodash'
import { BaseModel } from './BaseModel'
import { UserModel } from './UserModel'

export class BillModel extends BaseModel {
    constructor() {
        super()
        // 设置表名
        this.params = {
            TableName: Tables.ZeusPlatformBill,
        }
        // 设置对象属性
        this.item = {
            ...this.baseitem,
            sn: Model.StringValue,
            userId: Model.StringValue
        }
    }

    /**
     * 用户的账单流水
     * @param {*} initPoint 初始分
     * @param {*} userId 用户ID
     */
    async computeWaterfall(initPoint, userId) {
        const [queryErr, bills] = await this.query({
            IndexName: 'UserIdIndex',
            KeyConditionExpression: 'userId = :userId',
            ExpressionAttributeValues: {
                ':userId': userId
            }
        })
        if (queryErr) {
            return [queryErr, 0]
        }
        // 直接在内存里面做列表了. 如果需要进行缓存,以后实现
        const waterfall = _.map(bills.Items, (item, index) => {
            let balance = _.reduce(_.slice(bills.Items, 0, index + 1), (sum, item) => {
                return sum + item.amount
            }, 0.0) + initPoint
            return {
                ...bills.Items[index],
                oldBalance: balance - bills.Items[index].amount,
                balance: balance
            }
        })
        return [0, this.parseZip(waterfall.reverse())]
    }

    /**
     * 查询用户余额和最后一条账单记录
     * @param {*} user 
     */
    async checkUserLastBill(user) {
        const [queryErr, bills] = await this.query({
            IndexName: 'UserIdIndex',
            KeyConditionExpression: 'userId = :userId',
            ExpressionAttributeValues: {
                ':userId': user.userId
            }
        })
        if (queryErr) {
            return [queryErr, 0]
        }
        const sums = _.reduce(bills.Items, (sum, bill) => {
            return sum + bill.amount
        }, 0.0)
        let lastBill = bills.Items[bills.Items.length - 1]
        lastBill = lastBill || {}
        lastBill.lastBalance = user.points + sums
        return [0, lastBill]
    }

    /**
     * 查询用户余额
     * @param {*} user 
     */
    async checkUserBalance(user) {
        const [queryErr, bills] = await this.query({
            IndexName: 'UserIdIndex',
            KeyConditionExpression: 'userId = :userId',
            ExpressionAttributeValues: {
                ':userId': user.userId
            }
        })
        if (queryErr) {
            return [queryErr, 0]
        }
        const sums = _.reduce(bills.Items, (sum, bill) => {
            return sum + bill.amount
        }, 0.0)

        return [0, user.points + sums]
    }

    /**
     * 查询用户出账金额
     * @param {*} user 
     */
    async checkUserOut(user) {
        const [queryErr, bills] = await this.query({
            IndexName: 'ActionIndex',
            KeyConditionExpression: 'userId = :userId AND #action = :action',
            ExpressionAttributeNames: {
                '#action': 'action',
            },
            ExpressionAttributeValues: {
                ':userId': user.userId,
                ':action': -1
            }
        })
        if (queryErr) {
            return [queryErr, 0]
        }
        const sums = _.reduce(bills.Items, (sum, bill) => {
            return sum + bill.amount
        }, 0.0)

        return [0, user.points + sums * -1]
    }

    /**
     * 转账
     * @param {*} from 
     * @param {*} billInfo 
     */
    async billTransfer(from, billInfo) {
        // 输入数据处理
        billInfo = Omit(billInfo, ['sn', 'fromRole', 'fromUser', 'action'])
        const [toUserErr, to] = await new UserModel().getUserByName(billInfo.toRole, billInfo.toUser)
        if (toUserErr) {
            return [toUserErr, 0]
        }
        const Role = RoleModels[from.role]()
        if (!Role || Role.points === undefined) {
            return [BizErr.ParamErr('role error'), 0]
        }
        const fromInparam = Pick({
            ...Role,
            ...from
        }, Keys(Role))
        if (fromInparam.username == billInfo.toUser) {
            return [BizErr.ParamErr('不允许自我转账')]
        }
        // 存储账单流水
        const Bill = {
            ...Model.baseModel(),
            ...Pick({
                ...BillMo(),
                ...billInfo,
                fromUser: fromInparam.username,
                fromRole: fromInparam.role,
                fromLevel: fromInparam.level,
                fromDisplayName: fromInparam.displayName,
                action: 0,
                operator: from.operatorToken.username
            }, Keys(BillMo()))
        }
        const batch = {
            RequestItems: {
                'ZeusPlatformBill': [
                    {
                        PutRequest: {
                            Item: {
                                ...Bill,
                                amount: Bill.amount * (-1.0),
                                action: -1,
                                userId: from.userId
                            }
                        }
                    },
                    {
                        PutRequest: {
                            Item: {
                                ...Bill,
                                amount: Bill.amount * (1.0),
                                action: 1,
                                userId: to.userId
                            }
                        }
                    }
                ]
            }
        }
        const [err, ret] = await Store$('batchWrite', batch)
        if (err) {
            return [err, 0]
        }
        return [0, Bill]
    }
}
