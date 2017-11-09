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
    BillModel,
    BillActionEnum,
    Keys,
    Pick,
    Omit
} from '../lib/all'
import _ from 'lodash'

/**
 * 例子：分页查询
 * @param {*} queryParm 
 */
export const EXQueryPage = async (queryParm) => {
    const query = {
        TableName: Tables.ZeusPlatformUser,
        KeyConditionExpression: '#role = :role',
        // FilterExpression: 'adminName = :adminName',
        Limit: queryParm.limit,// 分页大小
        ExclusiveStartKey: queryParm.startkey,// 起始KEY
        ExpressionAttributeNames: {
            '#role': 'role'
        },
        ExpressionAttributeValues: {
            ':role': queryParm.role
        }
    }
    const [queryErr, queryRet] = await Store$('query', query)
    if (queryErr) {
        return [queryErr, 0]
    }
    return [0, queryRet]
}
/**
 * 例子：批量插入
 * @param {*} queryParm 
 */
export const EXBatchWrite = async (queryParm) => {
    const batch = {
        RequestItems: {
            'ZeusPlatformBill': [
                {
                    PutRequest: {
                        Item: {
                            sn: '5',
                            userId: 'c'
                        }
                    }
                },
                {
                    PutRequest: {
                        Item: {
                            sn: '6',
                            userId: 'd'
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
    return [0, ret]
}

/**
 * 例子：条件更新
 * @param {*} queryParm 
 */
export const EXUpdate = async (queryParm) => {
    var params = {
        TableName: Tables.ZeusPlatformBill,
        Key: {
            'sn': '2',
            'userId': 'b'
        },
        UpdateExpression: "set testv = :testv",
        ExpressionAttributeValues: {
            ":testv": 'asd',
        },
        ReturnValues: "UPDATED_NEW"
    };
    const [err, ret] = await Store$('update', params)
    if (err) {
        return [err, 0]
    }
    return [0, ret]
}

/**
 * 例子：条件删除
 * @param {*} queryParm 
 */
export const EXDelete = async (queryParm) => {
    var params = {
        TableName: Tables.ZeusPlatformBill,
        Key: {
            'sn': '2',
            'userId': 'b'
        },
        ConditionExpression: "testv = :testv",
        ExpressionAttributeValues: {
            ":testv": 'asd',
        },
    };
    const [err, ret] = await Store$('delete', params)
    if (err) {
        return [err, 0]
    }
    return [0, ret]
}
