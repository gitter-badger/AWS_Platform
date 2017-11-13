let  athena  = require("../lib/athena");
import {TABLE_NAMES} from "../config";
import {Util} from "../lib/Util"


import {CODES, CHeraErr} from "../lib/Codes";

import {Model} from "../lib/Dynamo"



export class UserBillDetailModel extends athena.BaseModel {
    constructor({betId, billId, amount, betAmount, betTime, time, preBalance} = {}) {
        super(TABLE_NAMES.PlayerBillDetail);
        this.betId = betId;
        this.billId = billId;
        this.amount = amount;
        this.betAmount = betAmount;
        this.betTime = betTime;
        this.time = time;
        this.preBalance = preBalance;
    }
    /**
     * 批量保存
     * @param {*} records 
     */
    batchWrite(records) {
        console.log(records);
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
}
