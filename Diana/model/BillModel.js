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
     * 商户的账单流水
     * @param {*} token 身份令牌
     * @param {*} userId 用户ID
     */
    async computeWaterfall(token, userId) {
        const [queryUserErr, user] = await new UserModel().queryUserById(userId)
        if (queryUserErr) {
            return [queryUserErr, 0]
        }
        if (!(token.role == RoleCodeEnum['PlatformAdmin'] || user.userId === token.userId || user.parent === token.userId)) {
            return [BizErr.TokenErr('only admin or user himself can check users balance'), 0]
        }
        const initPoints = parseFloat(user.points)
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
                return sum + parseFloat(item.amount)
            }, 0.0) + initPoints
            return {
                ...bills.Items[index],
                oldBalance: balance - parseFloat(bills.Items[index].amount),
                balance: balance
            }
        })
        return [0, waterfall.reverse()]
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
