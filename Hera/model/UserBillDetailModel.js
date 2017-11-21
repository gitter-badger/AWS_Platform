let  athena  = require("../lib/athena");
import {TABLE_NAMES} from "../config";
import {Util} from "../lib/Util"


import {CODES, CHeraErr} from "../lib/Codes";

import {Model} from "../lib/Dynamo"



export class UserBillDetailModel extends athena.BaseModel {
    constructor({sn, type, billId, userId, userName, amount, createdAt, businessKey, preBalance, rate, mix} = {}) {
        super(TABLE_NAMES.PlayerBillDetail);
        this.billId = billId || Util.billSerial(userId,-1);
        this.sn = sn || Util.billSerial(userId);
        this.type = type;
        this.userName = userName;
        this.amount = amount;
        this.rate = rate;
        this.userId = userId;
        this.createdAt = createdAt;
        this.businessKey = businessKey;
        this.preBalance = preBalance;
    }
    /**
     * 批量保存
     * @param {*} records 
     */
    async batchWrite(records) {
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
        return new Promise((reslove, reject) => {
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
                
                console.log("发生错误的总条目数:"+unArray.length);
                if(unArray.length > 0) {
                    console.log("重新处理");
                    return this.batchWrite(unArray);
                }else {
                    return reslove([null]);
                }
            }).catch((err) => {
                console.log("插入账单明细失败");
                console.log(records);
                console.log(err);
                return reslove([new CHeraErr(CODES.SystemError)]);
            });
        })
    }
    summary(list){
        //写入账单明细
        list.map((item) => {
            item.billId = this.billId;
            item.createdAt = +item.createdAt || 0;
            item.userName = this.userName;
            item.rate = this.rate || 0;
            item.action = item.amount >=0 ? 1 : -1;
            item.mix = this.mix || -1;
            item.originalAmount = +((+item.preBalance).toFixed(2));
            item.balance = +(item.preBalance + item.amount).toFixed(2);
            delete item.preBalance;
        })
 
        list.sort((a, b) => {
            return a.createdAt - b.createdAt;
        })
        //小汇总
        let  betArray = [], reArray= [], notDep = true;
        function findBet(array, b) {
            for(let i =0; i <array.length;i ++) {
                let item = array[i];
                if(item.businessKey == b.businessKey) {
                    return item;
                }
            }
        }
        list.forEach((item, index) => {
            if(item.type == 3) {
                let p = betArray.find((b) => b.businessKey == item.businessKey && item.businessKey)
                if(!p) {
                    p = {
                        ...item,
                        sn : Util.billSerial(this.userId, index),
                        type : 21,
                    }
                    betArray.push(p)
                    let reItem = list.find((p) => p.type == 4 && p.businessKey == item.businessKey);
                    if(!reItem){
                            notDep = false;
                    }else {
                        p.reAmount = reItem.amount; //返奖金额
                        p.reTime = reItem.createdAt;//返奖时间
                        p.balance = +(reItem.originalAmount + reItem.amount).toFixed(2);
                    }
                    
                }else {
                    p.amount += item.amount; //下注金额
                    if(!notDep) {
                        p.reTime = item.createdAt; //返奖时间
                        p.reAmount = 0;  //返奖金额
                        p.balance = +(item.originalAmount + item.amount).toFixed(2) //结算金额
                    }
                }
            }
        })
        list = list.concat(betArray);
        return list;
    }
    async findPlayerDetail(userName, createdAt) {
        createdAt = createdAt || Date.now();
        let opts = {
            KeyConditionExpression : "userName=:userName and createdAt>:createdAt",
            IndexName : "UserNameIndex",
            ExpressionAttributeValues : {
                ":userName" : userName,
                ":createdAt" : createdAt
            }
        }
        return this.promise("query",opts);
    }
    async getBillId(userName, createdAt) {
        createdAt = createdAt || Date.now();
        let opts = {
            KeyConditionExpression : "userName=:userName and createdAt>:createdAt",
            IndexName : "UserNameIndex",
            Limit :1,
            ExpressionAttributeValues : {
                ":userName" : userName,
                ":createdAt" : createdAt
            }
        }
        return new Promise((reslove, reject) => {
            this.db$("query",opts).then((result) => {
                if(result.Items.length>0) {
                    return reslove([0, result.Items[0].billId]);
                }
                return reslove([0, null]);
            }).catch((err) => {
                console.log(err);
                reslove([err, 0])
            });
        })
    }
}
