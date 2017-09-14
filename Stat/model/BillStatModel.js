let  athena  = require("../lib/athena");
let {RoleCodeEnum} = require("../lib/all");
import {TABLE_NAMES} from "../config";

const State = {
    normal : 1,  //正常,
    forzen : 2 //冻结
}

export class BillStatModel extends athena.BaseModel {
    constructor({userId, date, fromRole,amount, type,role} = {}) {
        super(TABLE_NAMES.BILL_STAT);
        this.userId = userId;
        this.date = date;
        this.role = role;
        this.amount = amount;
        this.type = type;  //1,日统计， 2，月统计
    }
}

