let {RoleCodeEnum} = require("../lib/Consts");

import {Util} from "../lib/Util"


import {BaseModel} from "../lib/athena"

import {
    Tables,
} from '../lib/all'



export class GameRecordModel extends BaseModel{
    constructor({record, userId} = {}) {
        super(Tables.HeraGameRecord);
        this.createAt = Date.now();
        this.userId = userId;
        this.id = Util.uuid();
        this.record = record
    }
    
}
