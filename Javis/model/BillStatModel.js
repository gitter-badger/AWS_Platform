let  athena  = require("../lib/athena");
let {RoleCodeEnum} = require("../lib/all");
import {TABLE_NAMES} from "../config";

const State = {
    normal : 1,  //正常,
    forzen : 2 //冻结
}

export class BillStatModel extends athena.BaseModel {
    constructor({userId, dateStr, fromRole,amount,role,gameType} = {}) {
        super(TABLE_NAMES.BILL_STAT);
        this.userId = userId;
        this.dateStr = dateStr;
        this.role = role;
        this.amount = amount;
        this.gemeType = gameType;
    }
}