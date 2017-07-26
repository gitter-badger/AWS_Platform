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

export class LogModel extends BaseModel {
    constructor() {
        super()
        // 设置表名
        this.params = {
            TableName: Tables.ZeusPlatformLog,
        }
        // 设置对象属性
        this.item = {
            ...this.baseitem,
            sn: Model.uuid(),
            userId: Model.StringValue
        }
    }
    
}
