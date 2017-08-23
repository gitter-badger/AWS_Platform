let  athena  = require("../lib/athena");
let {RoleCodeEnum} = require("../lib/Consts");
import {TABLE_NAMES} from "../config";
import {Util} from "../lib/Util";
import {MerchantModel} from "./MerchantModel"

const State = {
    normal : 1,  //正常,
    forzen : 2 //冻结
}

export class LogModel extends athena.BaseModel {
    constructor({userId, detail, role, type, username, suffix, action, operUser} = {}) {
        super(TABLE_NAMES.ZeusPlatformLog);
        this.sn = Util.uuid();
        this.createdAt = Date.now();
        this.userId = userId;
        this.detail = detail;
        this.role = role;
        this.type = type;
        this.username = username;
        this.operUser = operUser;
        this.suffix = suffix;
        this.action = action;
    }
}