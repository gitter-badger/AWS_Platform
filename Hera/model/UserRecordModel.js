let  athena  = require("../lib/athena");
let {RoleCodeEnum} = require("../lib/Consts");

import {CODES, CHeraErr} from  "../lib/Codes";
import {TABLE_NAMES} from "../config";
import {Util} from "../lib/Util"

const TypeEnum = {
    deposit : 1,   //转入
    take : 2   //转出
}

export const SettlementState = {  //结算状态
    success :1 ,// 成功结算
    fail : 2 //无效的结算
}



export class UserRecordModel extends athena.BaseModel {
    /**
     * 
     * @param {*} id 主键
     * @param {*} userId 用户ID 
     * @param {*} sn    流水号
     * @param {*} time  发生时间
     * @param {*} amount  本次发生金额 转入，正数   转出，负数
     * @param {*} preBalance  帐变前余额
     * @param {*} type (1转入(游戏大厅--》游戏)1, 转入 2转出 3 下注 4返奖 5 返还)
     * @param {*} businessKey （3、4、5 注单表ID）
     * @param {*} remark  备注 
     * @param {*} execUser 操作人
     */
    constructor({ userId,  depositAmount,checkOutBalance, income, records, state,remark} = {}) {
        super(TABLE_NAMES.TABLE_PALYER_RECORD);
        this.id = Util.uuid();
        this.userId = userId;
        this.createAt = Date.now();
        this.createdAt = Date.now();
        this.depositAmount = depositAmount || 0; //转入金额
        this.checkOutBalance = checkOutBalance || 0;     //转出金额
        this.income = income || 0;    //收益
        this.records = records;
        this.state = SettlementState.fail;
        // this.amount = amount; //转入，正数   转出，负数
        // this.preBalance = preBalance;
        // this.type = type;
        // this.remark = remark;
        // this.execUser = execUser;
    }

    /**
     * 验证账单是否正确
     * @param {*} recoreds 
     */
    validateRecords(){
        let playerRecordError = CODES.playerRecordError;
        // let singlieUser = this.isSingleUser();
        // if(!singlieUser) {
        //     this.remark = "数据非同一用户"
        //     return [new CHeraErr(playerRecordError.takeErr), 0]
        // }

        //获取玩家游戏累计收益（除去转入转出）
        let income = +(this.settlementIncome(this.records)).toFixed(2);
        this.income = income;
        this.state = SettlementState.success;
        return [0, income]
    } 
    isSingleUser(){
        if(this.records.length == 0) return false;
        let userId = this.records[0].userId;
        for(let i = 0; i < this.records.length; i++) {
            let uid = this.records[i].userId;
            if(userId != uid) {
                return false
            }
        }
        return true;
    }
    /**
     * 根据状态获取
     * @param {*} recoreds 
     */
    findRecordByType(type){
        let returnArr = [];
        for(let i = 0; i < this.records.length; i++) {
            let record = this.records[i];
            if(record.type == type) {
                returnArr.push(record);
            }
        }
        return returnArr;
    }

    /**
     * 结算收益
     * @param {*} records 
     */
    settlementIncome() {
        let income = 0;
        for(let i = 0; i < this.records.length; i++) {
            let record = this.records[i];
            let amount = record.amount;
            if(record.type != TypeEnum.deposit && record.type != TypeEnum.take){
                income += +amount
            }
        }
        return income;
    }
}