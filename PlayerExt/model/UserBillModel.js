let  athena  = require("../lib/athena");
import {TABLE_NAMES} from "../config";
import {UserBillDetailModel} from "./UserBillDetailModel"
import {Util} from "../lib/Util"


import {CODES, CHeraErr} from "../lib/Codes";

import {Model} from "../lib/Dynamo"



export class UserBillModel extends athena.BaseModel {
    constructor({gameId,originalAmount, userName, action, amount, userId, msn, merchantName, operator, type, 
        fromRole, toRole, fromUser, toUser, kindId, toolId, toolName, remark, typeName, gameType, seatInfo} = {}) {
        super(TABLE_NAMES.BILL_USER);
        this.billId = Util.billSerial(userId);
        this.userId = +userId
        this.action = +action;
        this.userName = userName;
        this.msn = msn;
        this.fromRole = fromRole;
        this.toRole = toRole || Model.StringValue;
        this.fromUser = fromUser;
        this.toUser = toUser || Model.StringValue;
        this.merchantName = merchantName || Model.StringValue;
        this.originalAmount = originalAmount || 0;
        this.operator = operator;
        this.createAt = Date.now();
        this.updateAt = Date.now();
        this.amount = +amount;
        this.seatInfo = seatInfo || Model.StringValue;
        this.kindId = kindId || -1;  //-1表示中心钱包的 -2初始点数 -3商城的
        this.gameId = gameId || -1;
        this.toolId = toolId || -1;
        this.toolName = toolName || Model.StringValue;
        this.type = type;
        this.remark = remark || Model.StringValue;
        this.setAmount(amount);
        this.typeName = typeName;
        this.gameType = gameType || -1; //-1表示不在游戏里面
    }
    setAmount(amount){
        if(this.action ==-1) {
            if(amount > 0)  this.amount = -amount;
        }
        if(this.action == 1){
            if(amount < 0) this.amount = -amount;
        }
    }
    setBillId(userId) {
        this.billId = Util.billSerial(userId);
    }
    async getBalance(){
        let [err, records] = await this.get({userName:this.userName}, ["userName","amount"], undefined, true);
        if(err) return [err, 0];
        records = records || [];
        let sumMount = 0;
        records.forEach(function(element) {
            sumMount += element.amount;
        });
        sumMount = +(sumMount.toFixed(2));
        return [null, sumMount];
    }
    
    async list(userName, gameId){
        let scanParams = {
            TableName : this.tableName,
            ScanIndexForward : false,
            LastEvaluatedKey : null,
            KeyConditionExpression : "userName=:userName",
            ExpressionAttributeValues : {
                ":userName" : userName
            }
        }
        if(gameId) {
            scanParams.FilterExpression ="gameId=:gameId";
            scanParams.ExpressionAttributeValues[":gameId"] = gameId;
        }
        return this.promise("query", scanParams);
    }
    async getBalanceByUid(userId){
        let [err, records] = await this.get({userId}, ["userName","amount","userId"], "userIdIndex", true);
        if(err) return [err, 0];
        records = records || [];
        let sumMount = 0;
        records.forEach(function(element) {
            sumMount += element.amount;
        });
        sumMount = +(sumMount.toFixed(2));
        return [null, sumMount];
    }
    carryPoint(){
        return super.save();
    }
    save(){
        //写入账单明细
        let list = this.records || [];
        if(list.length ==0) {
            list = [
                {
                    ...this.setProperties(),
                    createdAt : this.createAt,
                    type : this.type + 10,
                    billId : this.sn || Util.uuid()
                }
            ]
        }
        
        list.map((item) => {
            item.billId = this.billId;
            item.createdAt = +item.createdAt || 0;
            item.userName = this.userName;
            item.rate = this.rate || 0,
            item.mix = this.mix || -1;
        })
        console.log(this.setProperties());
        console.log("111111111111111111111111");
        // new UserBillDetailModel().batchWrite(list);
        return super.save();
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
    agentOper : 5,  //代理操作
}