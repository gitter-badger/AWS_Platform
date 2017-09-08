let  athena  = require("../lib/athena");
import {Tables} from "../lib/Dynamo"

export class PlayerModel extends athena.BaseModel {
    constructor({userName, userPwd, buId, state, merchantName,  msn, sex, paymentState, nickname, headPic} = {}) {
        super(Tables.HeraGamePlayer);
        
    }
}