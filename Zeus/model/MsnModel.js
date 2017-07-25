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
