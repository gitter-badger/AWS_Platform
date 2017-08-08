let  athena  = require("../lib/athena");
let {RoleCodeEnum} = require("../lib/Consts");
import {TABLE_NAMES} from "../config";

const State = {
    normal : 1,  //正常,
    forzen : 2 //冻结
}

export class MSNModel extends athena.BaseModel {
    constructor({userId, msn, createdAt, displayId, displayName, status, updatedAt} = {}) {
        super(TABLE_NAMES.TABLE_MSN);
        this.userId = userId;
        this.msn = msn;
        this.createdAt = createdAt;
        this.displayId = displayId;
        this.displayName = displayName;
        this.status = status;
        this.updatedAt = updatedAt;
    }
 
    
}