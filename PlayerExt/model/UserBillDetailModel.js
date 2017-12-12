let  athena  = require("../lib/athena");
import {TABLE_NAMES} from "../config";
import {Util} from "../lib/Util"


import {CODES, CHeraErr} from "../lib/Codes";

import {Model} from "../lib/Dynamo"



export class UserBillDetailModel extends athena.BaseModel {
    constructor({sn, gameId, billId} = {}) {
        super(TABLE_NAMES.PlayerBillDetail);
        this.sn = sn;
        this.gameId = gameId;
        this.billId = billId;
    }
    /**
     * 批量保存
     * @param {*} records 
     */
    batchWrite(records) {
        let sumBatch= [];
        for(let i =0; i < records.length; i += 25) {
            let batch = {
                "RequestItems":{
                    "PlayerBillDetail" : []
                } 
            }
            let saveArray = [];
            for(let j = i; j< i+25;j ++){
                let item = records[j];
                if(item) {
                    item.createdDate = this.parseDay(new Date(item.createdAt));
                    saveArray.push({
                        PutRequest : {
                            Item : item
                        }
                    })
                }
            }
            batch.RequestItems.PlayerBillDetail = saveArray;
            sumBatch.push(batch);
        }

        let promises = sumBatch.map((b)  => this.db$("batchWrite", b));
        
        Promise.all(promises).then((result) => {
            console.log("插入账单明细成功");
        }).catch((err) => {
            console.log("插入账单明细失败");
            console.log(err);
        });
        
    }
    /**
     * 账单流水明细
     * @param {*} userName 
     * @param {*} startTime 
     * @param {*} endTime 
     */
    billFlow(userName, startTime, endTime, type, action) {
        let opts = {
            IndexName : "UserNameIndex",
            ScanIndexForward :false,
            ProjectionExpression : ["sn","createdAt","#type","originalAmount","amount","balance","businessKey","remark","betId","userName","billId","id"].join(","),
            KeyConditionExpression : "createdAt between :startTime and :endTime and userName=:userName",
            ExpressionAttributeValues : {
                ":startTime":startTime,
                ":endTime" :endTime,
                ":userName" :userName
            },
            ExpressionAttributeNames : {
                "#type" : "type"
            }
        }
        if(type || action) {
            opts.FilterExpression = "";
            if(type) {
                type = + type;
                opts.FilterExpression = "#type=:type and ";
                opts.ExpressionAttributeValues[":type"] = type;
            }
            if(action) {
                action += action;
                if(action > 0) {
                    opts.FilterExpression += "amount>:amount1";
                    opts.ExpressionAttributeValues[":amount1"] = -0.00001;
                }else {
                    opts.FilterExpression += "amount<:amount2"
                    opts.ExpressionAttributeValues[":amount2"] = 0;
                }
            }else {
                opts.FilterExpression = opts.FilterExpression.substring(0, opts.FilterExpression.length-4);
            }
        }
        return this.promise("query",opts);
    }
    /**
     * 账单流水详情
     * @param {*} billId 
     */
    async billDetail(billId) {
        let opts = {
            IndexName : "BillIdIndex",
            ScanIndexForward :false,
            KeyConditionExpression : "billId=:billId",
            ProjectionExpression : ["sn", "createdAt","originalAmount","amount","reAmount","reTime","rate","mix","balance","#type","businessKey","roundId"].join(","),
            ExpressionAttributeValues : {
                ":billId":billId
            },
            ExpressionAttributeNames : {
                "#type":"type"
            }
        }
        let [queryErr, serialList] = await this.promise("query", opts);
        if(queryErr) return [queryErr];
        let sumList = [], sumObj = {};
        serialList.forEach(function(element) {
            if(element.type >= 3 && element.type <=5) {
                if(!sumObj[element.roundId]) {
                    sumObj[element.roundId] = [];
                }
                sumObj[element.roundId].push(element)
            }
        }, this);
        for(let roundId in sumObj) {
            let roundArr = sumObj[roundId];
            let betAmount = 0, originalAmount = 0;
            let roundBill = {
                roundId : roundId,
                createdAt : 0,
                originalAmount : 0,  //账前余额
                amount : 0,   //下注金额
                rate : 0, //成数
                balance : 0,  //结算金额
                mix : 0,  //洗马比
                reAmount : 0,  //返还金额
                deAmount : 0,  //净利
                balance : 0,   //返还后余额
                businessKey : ""  //betId
            }
            for(let i = 0; i < roundArr.length; i++) {
                let item = roundArr[i];
                if(item.type ==3) {
                    roundBill.roundId = item.roundId;
                    roundBill.amount += +(item.amount.toFixed(2));
                    roundBill.createdAt = item.createdAt;
                    roundBill.businessKey= item.businessKey;
                    roundBill.rate = item.rate || 0;
                    roundBill.mix = item.mix || 0;
                    if(roundBill.originalAmount < item.originalAmount || roundBill.originalAmount == 0) {
                        roundBill.originalAmount = item.originalAmount;
                    }
                }
                if(item.type == 4 || item.type == 5) {
                    roundBill.reAmount += +(Math.abs(item.amount).toFixed(2));
                    if(roundBill.balance < item.balance) {
                        roundBill.balance = item.balance
                    }
                }
            }
            roundBill.deAmount = +((roundBill.reAmount + roundBill.amount).toFixed(2));
            sumList.push(roundBill);
        }
        return [null, sumList];
    }
}
