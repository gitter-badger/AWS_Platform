/**
 * 游戏公告
 */
let  athena  = require("../lib/athena");
import {Tables,Model} from "../lib/Dynamo"
import {Util} from "../lib/Util";
/**
 * 邮件状态
 */
const EmailState = {
    notSend : 0,  //未发送
    alreadySend :1  //已发送
}


export class PlayerEmailRecordModel extends athena.BaseModel {
    constructor({userId, emid} = {}) {
        super(Tables.HawkeyeGameEmail);
        this.userId = userId;    //创建者
        this.sn = Util.uuid();
        this.createdAt = Date.now();
        this.emid = emid;
    }
    
}