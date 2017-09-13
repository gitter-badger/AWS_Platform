/**
 * 游戏公告
 */
let  athena  = require("../lib/athena");
import {Tables,Model} from "../lib/Dynamo"
import {Util} from "../lib/Util";
import {UserModel}  from "./UserModel"
/**
 * 邮件状态
 */
const EmailState = {
    notSend : 0,  //未发送
    alreadySend :1  //已发送
}


export class AdvertModel extends athena.BaseModel {
    constructor({adId, adName, adStatus, createdAt, img, remark, updateAt, url} = {}) {
        super(Tables.HulkPlatformAd);
        this.adId = adId;
        this.adName = adName;
        this.adStatus = adStatus;
        this.createdAt = createdAt;
        this.img = img;
        this.remark = remark;
        this.updateAt = updateAt;
        this.url = url;
    }
}