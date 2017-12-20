let  athena  = require("../lib/athena");
import {TABLE_NAMES} from "../config";
import {Util} from "../lib/Util"


import {CODES, CHeraErr} from "../lib/Codes";

import {Model} from "../lib/Dynamo"

import {UserModel} from "./UserModel"
import {MerchantModel} from "./MerchantModel"



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
        return Promise.all(promises).then((result) => {
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
                    return [0]
                }
            }).catch((err) => {
                console.log("插入账单明细失败");
                console.log(records);
                console.log(err);
                return [new CHeraErr(CODES.SystemError)]
            });
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
    async getLastDetail(userName, createdAt) {
        createdAt = createdAt || Date.now();
        let opts = {
            KeyConditionExpression : "userName=:userName and createdAt>:createdAt",
            IndexName : "UserNameIndex",
            ScanIndexForward : false,
            Limit :1,
            ExpressionAttributeValues : {
                ":userName" : userName,
                ":createdAt" : createdAt
            }
        }
        return new Promise((reslove, reject) => {
            this.db$("query",opts).then((result) => {
                if(result.Items.length>0) {
                    return reslove([0, result.Items[0]]);
                }
                return reslove([0, null]);
            }).catch((err) => {
                console.log(err);
                reslove([err, 0])
            });
        })
    }
    async handlerRecordsAndSave(records, gameType) {
        //找到所有用户，所有用户的商家 测试点，如果没有记录，单个用户，多个用户
        let uidSet = new Set(),uids= [], parentSet = new Set(),parentIds = [], userListErr, userList = [], merchantListErr, merchantList = [];
        records.forEach((item) => {
            uidSet.add(item.userId);
        })
        uids = [...uidSet];
        let user = new UserModel();
        if(uids.length > 0) {
            [userListErr, userList] = await user.findByUids(uids);
            if(userListErr) {
                return [userListErr]
            }
            for(let i = 0; i < userList.length; i++) {
                let userItem = userList[i];
                if(!userItem) {
                    userList.splice(i, 1);
                    i --;
                }else {
                    parentSet.add(userItem.parent);
                }
            }
           
            parentIds = [...parentSet];
            let merchant = new MerchantModel();
            [merchantListErr, merchantList] = await merchant.findByUids(parentIds);
            if(merchantListErr) {
                return [merchantListErr]
            }
            for(let i = 0; i < merchantList.length; i++) {
                if(!merchantList[i]) {
                    merchantList.splice(i, 1);
                    i --;
                }
            }
        }
        //给records增加洗马比，billId（进入游戏的sessionId）
        for(let i = 0,rl = records.length; i < rl; i++) {
            let record = records[i],mix =0,rate = 0;
            let recordUser = userList.find((u) => {
                return u.userId == record.userId;
            })
            //不需要判断玩家是否在游戏中，如果不在游戏中，sessionId为null
            let recordMerchant = merchantList.find((m) => {
                return m.userId == (recordUser || {}).parent;
            })

            if(!recordUser || !recordMerchant) {
                records.splice(i, 1);
                i --;
                continue;
            }

            if(gameType == "30000"){
                mix = recordUser.vedioMix ||  recordMerchant.vedioMix ;
            } 
            if(gameType == "40000"){
                mix = recordUser.liveMix || recordMerchant.liveMix;
            }
            
            Object.assign(record, {
                action : record.amount>=0 ? 1 :-1,
                balance : +((+record.preBalance) + (+record.amount)).toFixed(2),
                billId : recordUser.sessionId,
                createdDate : this.parseDay(new Date()),
                userName : recordUser.userName,
                mix :mix == undefined ? 1 : mix,
                originalAmount : +((+record.preBalance).toFixed(2)),
                rate : recordMerchant.rate,
                gameType
            })
        }
        console.log("11111111111111");
        console.log(records);
        if(records.length> 0) {
            return this.batchWrite(records);
        }else {
            return [null];
        }
         
    }   
}
