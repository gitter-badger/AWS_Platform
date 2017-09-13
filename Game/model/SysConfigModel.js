/**
 * 游戏公告
 */
let  athena  = require("../lib/athena");
import {Tables} from "../lib/Dynamo"
import {Util} from "../lib/Util";


export class SysConfigModel extends athena.BaseModel {
    constructor({} = {}) {
        super(Tables.SYSConfig);
    }
}