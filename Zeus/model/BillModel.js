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
    BillMo,
    RoleCodeEnum,
    RoleModels
} from '../lib/all'
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
     * 查询用户余额和最后一条账单记录
     * @param {*} user 
     */
    async checkUserBalance(user) {
        if (user.points == undefined || user.points == null) {
            return [BizErr.ParamErr('User dont have base points'), 0]
        }
        const baseBalance = parseFloat(user.points)
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
            return sum + parseFloat(bill.amount)
        }, 0.0)
        let lastBill = bills.Items[bills.Items.length - 1]
        lastBill = lastBill || {}
        lastBill.lastBalance = baseBalance + sums
        return [0, lastBill]
    }

    /**
     * 返回某个账户下的余额
     * @param {*} token 
     * @param {*} user 
     */
    async checkBalance(token, user) {
        // 因为所有的转账操作都是管理员完成的 所以 token必须是管理员.
        // 当前登录用户只能查询自己的balance
        if (!(token.role == RoleCodeEnum['PlatformAdmin'] || user.userId === token.userId || user.parent === token.userId)) {
            return [BizErr.TokenErr('only admin or user himself can check users balance'), 0]
        }
        let [err, res] = await this.checkUserBalance(user)
        if (err) {
            return [err, 0]
        }
        return [0, res.lastBalance]
    }

    /**
     * 转账
     * @param {*} from 
     * @param {*} billInfo 
     */
    async billTransfer(from, billInfo) {
        // 输入数据校验
        if (Empty(billInfo)) {
            return [BizErr.ParamMissErr(), 0]
        }
        // move out user input sn
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
        if (!fromInparam.role || !fromInparam.username) {
            return [BizErr.ParamErr('Param error,invalid transfer. from** null')]
        }
        if (fromInparam.username == billInfo.toUser) {
            return [BizErr.ParamErr('Param error,invalid transfer. self transfer not allowed')]
        }
        // 数据类型处理
        fromInparam.role = fromInparam.role.toString()
        billInfo.toRole = billInfo.toRole.toString()
        // 存储账单流水
        const Bill = {
            ...Model.baseModel(),
            ...Pick({
                ...BillMo(),
                ...billInfo,
                fromUser: fromInparam.username,
                fromRole: fromInparam.role,
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

    // async batchSave() {
    //     const batch = {
    //         RequestItems: {
    //             'ZeusPlatformBill': [
    //                 {
    //                     PutRequest: {
    //                         Item: {
    //                             sn: '1',
    //                             userId: 'a'
    //                         }
    //                     }
    //                 },
    //                 {
    //                     PutRequest: {
    //                         Item: {
    //                             sn: '2',
    //                             userId: 'b'
    //                         }
    //                     }
    //                 }
    //             ]
    //         }
    //     }
    //     return await this.batchWrite(batch)
    // }

    // async updateDate() {
    //     const params = {
    //         Key: {
    //             'sn': '1',
    //             'userId': 'a'
    //         },
    //         UpdateExpression: "set testv = :testv",
    //         ExpressionAttributeValues: {
    //             ":testv": 'asd',
    //         },
    //         ReturnValues: "UPDATED_NEW"
    //     }
    //     return await this.updateItem(params)
    // }

    // async deleteData() {
    //     const params = {
    //         Key: {
    //             'sn': '1',
    //             'userId': 'a'
    //         },
    //         ConditionExpression: "testv = :testv",
    //         ExpressionAttributeValues: {
    //             ":testv": 'asd',
    //         },
    //     }
    //     return await this.deleteItem(params)
    // }

    // async queryPage() {
    //     const params = {
    //         KeyConditionExpression: 'sn = :sn',
    //         // FilterExpression: 'adminName = :adminName',
    //         Limit: 2,   // 分页大小
    //         ExclusiveStartKey: {"sn":"2","userId":"b"},// 起始KEY
    //         ExpressionAttributeValues: {
    //             ':sn': '2'
    //         }
    //     }
    //     return await this.query(params)
    // }
}
