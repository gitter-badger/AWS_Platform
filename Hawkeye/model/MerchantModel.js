let  athena  = require("../lib/athena");

import {Tables} from "../lib/Dynamo"

import {RoleCodeEnum} from "../lib/Consts"

export class MerchantModel extends athena.BaseModel {
    constructor({displayId, parent, rate, msn, userId} = {}) {
        super(Tables.ZeusPlatformUser);
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
    all(){
        return this.scan({role:RoleCodeEnum.Merchant});
    }
}