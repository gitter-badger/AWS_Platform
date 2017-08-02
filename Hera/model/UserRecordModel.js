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
     * @param {*} type (1转入(游戏大厅--》游戏) 2转出 3 下注 4返奖 5 返还)
     * @param {*} businessKey （3、4、5 注单表ID）
     * @param {*} remark  备注 
     * @param {*} execUser 操作人
     */
    constructor({ userId,  depositAmount,takeAmount, income, recoreds, state,remark} = {}) {
        super(TABLE_NAMES.TABLE_PALYER_RECORD);
        this.id = Util.uuid();
        this.userId = userId;
        this.createAt = Date.now();
        this.depositAmount = depositAmount; //转入金额
        this.takeAmount = takeAmount;     //转出金额
        this.income = income;    //收益
        this.recoreds = recoreds;
        this.state = SettlementState.fail;
        this.remark = remark;
        // this.list = list;
        // this.userId = userId;
        // this.time = time;
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
        //获取转入数据
        let playerRecordError = CODES.playerRecordError;
        let depositArr = this.findRecordByType(this.recoreds, TypeEnum.deposit);
        //转入数据只允许有一条，超过视为不合法
        if(depositArr.length != 1){
            this.remark = "转入数据大于一条"
            return [new CHeraErr(playerRecordError.depositErr)]
        }
        let depositRecord = depositArr[0];

        let takeArr = this.findRecordByType(this.recoreds, TypeEnum.take);
        if(takeArr.length != 1){
            this.remark = "转出数据大于一条"
            return [new CHeraErr(playerRecordError.takeErr)]
        }
        let takeRecord = takeArr[0]

        //检查所有的数据是否为同一用户
        let singlieUser = this.isSingleUser(this.recoreds);
        let userId = this.recoreds[0].userId
        this.userId = userId;
        if(!singlieUser) {
            this.remark = "数据非同一用户"
            return [new CHeraErr(playerRecordError.takeErr)]
        }
        
        let depositAmount = (+depositRecord.amount).toFixed(2) //存入多少金额
        let takeAmount = (+takeRecord.amount).toFixed(2);   //取出多少金额

        //获取玩家游戏累计收益（除去转入转出）
        let income = (this.settlementIncome(recoreds)).toFixed(2);

        this.depositAmount = depositAmount;
        this.takeAmount = takeAmount;
        this.income = income;
        //取出金额 = 存入金额+收益
        if(takeAmount == depositAmount+income) { //如果相等，视为账单合法
            this.state = SettlementState.success;
            return [0, true, {depositAmount, takeAmount, income}]
        }else { //否则不合法
            this.remark = "账单金额不匹配"
            return [0, false, {depositAmount, takeAmount, income}]
        }
    } 
    isSingleUser(recoreds){
        if(recoreds.length == 0) return false;
        let userId = recoreds[0].userId;
        for(let i = 0; i < recoreds.length; i++) {
            let uid = recoreds[i].uid;
            if(userId != uid) {
                return false
                break;
            }
        }
        return true;
    }
    /**
     * 根据状态获取
     * @param {*} recoreds 
     */
    findRecordByType(recoreds, type){
        let returnArr = [];
        for(let i = 0; i < recoreds.length; i++) {
            let record = recoreds[i];
            if(record.type == type) {
                returnArr.push(record);
            }
        }
        return returnArr;
    }

    /**
     * 结算收益
     * @param {*} recoreds 
     */
    settlementIncome(recoreds) {
        let income = 0;
        for(let i = 0; i < recoreds.length; i++) {
            let record = recoreds[i];
            let amount = record.amount;
            income += +amount
        }
        return income;
    }
}