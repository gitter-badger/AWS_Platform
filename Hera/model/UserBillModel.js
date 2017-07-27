let  athena  = require("../lib/athena");
import {TABLE_NAMES} from "../config";
import {Util} from "../lib/Util"


import {CODES, CHeraErr} from "../lib/Codes";



export class UserBillModel extends athena.BaseModel {
    constructor({userName, action, amount, userId, msn, merchantName, operator, type} = {}) {
        super(TABLE_NAMES.BILL_USER);
        this.billId = Util.uuid();
        this.userId = userId
        this.action = +action;
        this.userName = userName;
        this.msn = msn;
        this.type = type;
        this.merchantName = merchantName;
        this.originalAmount = 0;
        this.operator = operator;
        this.createAt = Date.now();
        this.updateAt = Date.now();
        this.amount = +amount;
        if(this.action == Action.reflect) this.amount = -this.amount;
        this.type = this.action == Action.recharge ? Type.recharge : Type.reflect
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
    async list(userName){
        let scanParams = {
            TableName : this.tableName,
            FilterExpression : "userName=:userName",
            ExpressionAttributeValues : {
                ":userName" : userName
            }
        }
        return new Promise((reslove, reject) => {
            this.db$("scan", scanParams).then((result)=>{
                return reslove([null, result.Items]);
            }).catch((error) => {
                return reslove([error, 0]);
            })
        })
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
//账单类型
export const Type = {
    recharge : 1, //中心钱包转入平台钱包
    withdrawals : 2 //平台转入中心钱包
}