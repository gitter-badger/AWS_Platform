let  athena  = require("../lib/athena");
import {TABLE_NAMES} from "../config";
import {Util} from "../lib/Util";
import {RoleCodeEnum} from "../lib/Consts"

import {CODES, CHeraErr} from "../lib/Codes";

import {Model} from "../lib/Dynamo"



export class MerchantBillModel extends athena.BaseModel {
    constructor({userId, action, amount, userName, operator, fromRole, toRole, fromUser, toUser, gameId, remark} = {}) {
        super(TABLE_NAMES.PLATFORM_BILL);
        this.sn = Util.uuid();
        this.userId = userId;
        this.action = +action;
        this.gameId = gameId;
        this.setAmount(amount);
        this.fromRole = fromRole;
        this.toRole = toRole;
        this.fromUser = fromUser;
        this.toUser = toUser;
        this.operator = operator;
        this.username = userName;
        this.createdAt = Date.now();
        this.updatedAt = Date.now();
        this.remark = remark || Model.StringValue;
    }
    setAmount(amount) {
        if(this.action ==-1) {
            if(amount > 0)  this.amount = -amount;
        }
        if(this.action == 1){
            if(amount < 0) this.amount = -amount;
        }
    }
    async getBlance(){
        let [err, records] = await this.get({userId: this.userId}, [], "UserIdIndexSec", true);
        if(err) return [err, 0];
        records = records || [];
        let sumMount = 0;
        records.forEach(function(element) {
            sumMount += element.amount;
        });
        return [null, sumMount.toFixed(2)];
    }

   
    carryPoint(){
        return this.save();
    }
    async handlerPoint(){
        if(this.action === Action.recharge){ //玩家充值(转入中心钱包) 商家点数对应增加
            return this.carryPoint();
        }else if(this.action === Action.reflect){ //充值(中心钱包转入平台钱包) 商家点数对应减少
            //检查商户余额
            let [err, amount] = await this.getBlance();
            if(err) return [err, 0];
            if(-this.amount > amount){  //如果所提的点数比商家余额还要少，提现失败 -this.amount 表示
                return [new CHeraErr(CODES.merBalIns),0]
            }else {
                return this.carryPoint();
            }
        }else{
            return [new CHeraErr(CODES.DataError),0];
        }
    }
}

export const Action = {
    recharge : 1,  //增加
    reflect : -1 //减少
}

export const Type = {
    recharge : 1, //中心钱包转入到平台钱包
    reflect : 2,  //平台钱包转入中心钱包
}