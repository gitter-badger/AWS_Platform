let  athena  = require("../lib/athena");
let {RoleCodeEnum} = require("../lib/all");
import {Util} from "../lib/Util"

import {TABLE_NAMES} from "../config";

const State = {
    normal : 1,  //正常,
    forzen : 2 //冻结
}

export class BillStatModel extends athena.BaseModel {
    constructor({sn, userId, dateStr, fromRole,amount,role,gameType, type,createdAt} = {}) {
        super(TABLE_NAMES.BILL_STAT);
        this.sn = sn || Util.uuid();
        this.createdAt = createdAt || Date.now();
        this.userId = userId;
        this.dateStr = dateStr;
        this.role = role;
        this.type = type;  //1，日统计，2，月统计,3,所有用户日统计
        this.amount = amount;
        this.gameType = gameType;
    }
}