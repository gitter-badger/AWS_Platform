let  athena  = require("../lib/athena");
import {TABLE_NAMES} from "../config";
import {Util} from "../lib/Util"


import {CODES, CHeraErr} from "../lib/Codes";



export class UserBillModel extends athena.BaseModel {
    constructor({userName, action, amount, userId} = {}) {
        super(TABLE_NAMES.BILL_USER);
        this.sn = Util.uuid();
        this.action = +action;
        this.userName = userName;
        this.createAt = Date.now();
        this.updateAt = Date.now();
        this.amount = +amount;
        if(this.action == Action.reflect) this.amount = -this.amount;
    }

    async getBalance(){
        let [err, records] = await this.get({userName:this.userName}, ["userName","amount"], "userNameIndex", true);
        if(err) return [err, 0];
        records = records || [];
        let sumMount = 0;
        records.forEach(function(element) {
            sumMount += element.amount;
        });
        return [null, sumMount];
    }

    carryPoint(){
        return this.save();
    }
    async handlerPoint(){
        if(this.action === Action.recharge){ //玩家充值(中心钱包转入平台钱包) 玩家平台钱数对应增加
            return this.carryPoint();
        }else if(this.action === Action.reflect){ //玩家体现(平台钱包转入中心钱包) 玩家点数减少
            let [amountError, amount] = await this.getBalance();
            if(amountError) return [amountError, 0];
            if(-this.amount > amount){  //如果所提的点数比商家余额还要少，提现失败 -this.amount 表示
                return [new CHeraErr(CODES.palyerIns),0]
            }else{
                return this.carryPoint();
            }
        }else{
            return [new CHeraErr(CODES.DataError),0];
        }
    }
    
}

export const Action = {
    recharge : 1,  //充值
    reflect : -1 //体现
}