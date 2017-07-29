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
    RoleCodeEnum,
    MSNStatusEnum,
    RoleModels
} from '../lib/all'

import { BaseModel } from './BaseModel'

export class MsnModel extends BaseModel {
    constructor() {
        super()
        // 设置表名
        this.params = {
            TableName: Tables.ZeusPlatformMSN,
        }
        // 设置对象属性
        this.item = {
            ...this.baseitem,
            msn: Model.StringValue,
            userId: Model.StringValue
        }
    }
    
}
