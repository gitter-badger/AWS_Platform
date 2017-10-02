let {RoleCodeEnum} = require("../lib/Consts");

import {Util} from "../lib/Util"
import {CODES, CHeraErr} from "../lib/Codes";


import {BaseModel} from "../lib/athena"

import {
    Tables,
} from '../lib/all'

export class GameRecordModel extends BaseModel{
    constructor(record = {}) {
        super(Tables.HeraGameRecord);
        this.userId = record.userId; //用户ID
        this.userName = record.userName; //用户名
        this.gameId = record.gameId;
        this.betId = record.betId;  //投注编号
        this.betTime = record.betTime;  //投注时间
        this.parentId = record.parentId; //上一级ID
        this.createdAt = Date.now();
        this.record = record; //记录，包含所有的详情
    }
}
