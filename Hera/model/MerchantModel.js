let  athena  = require("../lib/athena");

import {TABLE_NAMES} from "../config";
export class MerchantModel extends athena.BaseModel {
    constructor({displayId, parent, rate, msn, userId} = {}) {
        super(TABLE_NAMES.TABLE_MERCHANT);
        this.displayId = this.displayId;
        this.parent = parent;
        this.rate = rate;
        this.userId = userId;
        this.msn = msn;
    }

    findById(displayId){
        return this.get({
            displayId
        }, [], "merchantIdIndex");
    }

    commission(){
        let parent = this.parent;
        return this.findParentCommission([this.rate], this.userId, parent);
    }

    async findParentCommission(intoArray, userId, parent){
        if(Object.is(parent, "00") || Object.is(parent, "01")) {
            return [null, intoArray]
        }
        let [comissionError, mInfo] = await this.get({
            userId : parent
        }, [], "UserIdIndex");
        if(comissionError) return [comissionError ,null];
        if(!mInfo) return [null, intoArray];
        if(mInfo.rate) intoArray.push(mInfo.rate);
        return this.findParentCommission(intoArray, mInfo.userId, mInfo.parent);
    }
}