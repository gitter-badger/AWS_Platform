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
     * 查询用户余额
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

        return [0, baseBalance + sums]
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
        return await this.checkUserBalance(user)
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
