let  athena  = require("../lib/athena");
import {TABLE_NAMES} from "../config";
import {Util} from "../lib/Util"


import {CODES, CHeraErr} from "../lib/Codes";

import {Model} from "../lib/Dynamo"



export class UserBillDetailModel extends athena.BaseModel {
    constructor({sn, type, billId, userId, userName, amount, createdAt, businessKey, preBalance} = {}) {
        super(TABLE_NAMES.PlayerBillDetail);
        this.sn = sn || Util.billSerial(userId);
        this.type = type;
        this.billId = billId;
        this.userName = userName,
        this.amount = amount,
        this.createdAt = createdAt;
        this.businessKey = businessKey;
        this.preBalance = preBalance;
    }
    /**
     * 批量保存
     * @param {*} records 
     */
    batchWrite(records) {
        console.log("批量写入前："+Date.now());
        let  createdDate = this.parseDay(new Date()),promises = [];
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
                    item.createdDate = createdDate;
                    saveArray.push({
                        PutRequest : {
                            Item : item
                        }
                    })
                }
            }
            batch.RequestItems.PlayerBillDetail = saveArray;
            promises.push(this.db$("batchWrite", batch));
        }
        Promise.all(promises).then((result) => {
            console.log("插入账单明细成功");
            // console.log(result);
            console.log(result.length);
            console.log("批量写入后："+Date.now());
            let unArray = [],errPromiseNum = 0;
            for(let i =0; i < result.length; i++) {
                let r = result[i];
                if(r.UnprocessedItems.PlayerBillDetail) {
                    errPromiseNum ++;
                    unArray = unArray.concat(r.UnprocessedItems.PlayerBillDetail);
                }
            }
            for(let i = 0; i < unArray.length; i++) {
                unArray[i] = unArray[i].PutRequest.Item;
            }
            console.log("重新处理");
            console.log("发生错误的总条目数:"+unArray.length);
            if(unArray.length > 0) {
                this.batchWrite(unArray);
            }
        }).catch((err) => {
            console.log("插入账单明细失败");
            console.log(records);
            console.log(err);
        });
    }
}
