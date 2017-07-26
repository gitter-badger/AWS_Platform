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
