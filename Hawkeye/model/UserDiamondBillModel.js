let  athena  = require("../lib/athena");
import {Util} from "../lib/Util"

import {Model, Tables} from "../lib/Dynamo"
import {CODES, CHeraErr} from "../lib/Codes";




export class UserDiamondBillModel extends athena.BaseModel {
    constructor({seatId, userId, action, userName, msn, originalDiamonds,diamonds, toolId, kindId} = {}) {
        super(Tables.HeraGameDiamondBill);
        this.seatId = seatId;
        this.billId = Util.uuid();
        this.userId = +userId
        this.action = +action;
        this.userName = userName;
        this.msn = msn;
        this.originalDiamonds = 0;
        this.createAt = Date.now();
        this.diamonds = +diamonds;
        this.toolId = toolId;
        this.kindId = kindId || "0"; //游戏ID，如果是大厅，则为0
    }
    setAmount(amount){
        if(this.action ==-1) {
            if(amount > 0)  this.amount = -amount;
        }
        if(this.action == 1){
            if(amount < 0) this.amount = -amount;
        }
    }
    async getBalance(){
        let [err, records] = await this.get({userName:this.userName},["userName","diamonds"], "UserNameIndex", true);
        if(err) return [err, 0];
        records = records || [];
        let sumMount = 0;
        records.forEach(function(element) {
            sumMount += +element.diamonds;
        });
        return [null, sumMount];
    }
    
    async list(userName, gameId){
        let scanParams = {
            TableName : this.tableName,
            FilterExpression : "userName=:userName ",
            ExpressionAttributeValues : {
                ":userName" : userName
            }
        }
        if(gameId) {
            scanParams.FilterExpression +="and gameId=:gameId";
            scanParams.ExpressionAttributeValues[":gameId"] = gameId;
        }
        
        return new Promise((reslove, reject) => {
            this.db$("scan", scanParams).then((result)=>{
                return reslove([null, result.Items]);
            }).catch((error) => {
                return reslove([error, 0]);
            })
        })
    }
    async getBalanceByUid(userId){
        let [err, records] = await this.get({userId}, ["userName","amount","userId"], "userIdIndex", true);
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
//账单类型
export const Type = {
    recharge : 1, //中心钱包转入平台钱包
    withdrawals : 2, //平台转入中心钱包
    gameSettlement : 3, //游戏结算
    buyTool : 4,  //购买游戏道具
}