let  athena  = require("../lib/athena");
import {Tables} from "../lib/Dynamo"

export class PlayerModel extends athena.BaseModel {
    constructor({userName, userPwd, buId, state, merchantName,  msn, sex, paymentState, nickname, headPic} = {}) {
        super(Tables.HeraGamePlayer);
    }
    async sumCount(){
        let [agentErr, agentCount] = await this.count("msn=:msn",{":msn":"000"});
        if(agentErr) {
            return [agentErr, 0];
        }
        let [sumErr, sum] = await this.count(null, null);
        if(sumErr) {
            return [sumErr, 0];
        }
        return [null, sum - agentCount];
    }
}