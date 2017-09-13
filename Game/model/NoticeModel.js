/**
 * 游戏公告
 */
let  athena  = require("../lib/athena");
import {Tables} from "../lib/Dynamo"
import {Util} from "../lib/Util";


export class NoticeModel extends athena.BaseModel {
    constructor({userId, content, showTime, kindId,startTime, endTime, splitTime, gameName, msn, count} = {}) {
        super(Tables.HawkeyeGameNotice);
        this.userId = userId;    //创建者
        this.noid = Util.uuid();
        this.content = content;
        this.createdAt = Date.now();
        this.updatedAt = Date.now();
        this.showTime = +showTime;  //公告显示时间（单位秒）
        //this.kindId = kindId;   //游戏ID，如果是广场为0 -1,所有游戏;
        // this.gameName = gameName;   //游戏名
        this.startTime = +startTime; //开始时间
        this.endTime = +endTime;     //结束时间
        this.splitTime = +splitTime;  //播放间隔（单位秒）
        this.count = +count; //总播放次数
        // this.msn = +msn;  //商家线路号
    }
    async update(conditions, updates) {
        return super.update(conditions, this.setProperties(updates));
    }
}