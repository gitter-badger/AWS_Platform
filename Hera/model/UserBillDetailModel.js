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
        // return new Promise((reslove, reject) => {
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
        // })
    }
    summary(list, lastCreatedAt){
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
            let returnArr = [];
            for(let i =0; i <array.length;i ++) {
                let item = array[i];
                if(item.businessKey == b.businessKey && (item.type == 4 || item.type==5)) {
                    returnArr.push(item);
                }
            }
            return returnArr;
        }
        list.forEach((item, index) => {
            let alreadySave = lastCreatedAt ? item.createdAt > lastCreatedAt : true;
            if(item.type == 3 && alreadySave) {
                let p = betArray.find((b) => b.businessKey == item.businessKey && item.businessKey);
                if(!p) {
                    p = {
                        ...item,
                        sn : Util.billSerial(this.userId, index),
                        type : 21,
                        reTime : item.createdAt,
                        reAmount : 0,
                        balance :+(item.originalAmount + item.amount).toFixed(2)
                    }
                    betArray.push(p)
                    let reItem = list.find((p) => (p.type == 4 || p.type==5) && p.businessKey == item.businessKey);
                    if(reItem){
                        p.reAmount += reItem.amount; //返奖金额
                        p.reTime = reItem.createdAt;//返奖时间
                        p.balance = +(reItem.originalAmount + reItem.amount).toFixed(2);
                        if(this.gameType == "30000") {
                            p.balance = +(p.balance + reItem.amount).toFixed(2);
                        }
                    }
                }else {
                    p.amount += item.amount; //下注金额
                }
            }
        })
        list = list.concat(betArray);
        return list;
    }
    //真人
    summaryLive(list){
        list.reverse();
        let liveArr = [];
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
        function findBet(item) {
            let isBet = item.type == 3;
            for(let i = 0; i < liveArr.length; i++) {
                let live = liveArr[i];
                if(isBet && item.type == 3 && item.createdAt == live.createdAt) {
                    return live;
                }
                if(!isBet && (item.type ==4 || item.type ==5) && live.businessKeys.indexOf(item.businessKey) !=-1) {
                    return live;
                }
            }
            return null;
        }
        for(let i = 0; i < list.length; i++) {
            let item = list[i];
            if(item.type > 5 || item.type<3) continue;
            let live = findBet(item);
            if(!live) {
                if(item.type == 3) {
                    live = {
                        ...item,
                        sn : Util.billSerial(this.userId, i),
                        type : 21,
                        reTime : item.createdAt,
                        reAmount : 0,
                        businessKeys : [item.businessKey]
                    }
                }else {
                    live = {
                        ...item,
                        sn : Util.billSerial(this.userId, i),
                        type : 21,
                        amount : 0,
                        reTime : item.createdAt,
                        reAmount : item.amount,
                        balance :+(item.originalAmount + item.amount).toFixed(2),
                        businessKeys : [item.businessKey]
                    }
                }
                liveArr.push(live);
            }else {
                if(item.type == 3) {
                    live.amount += item.amount;
                    live.businessKeys.push(item.businessKey);
                }else {
                    live.reAmount += item.amount;
                    live.reTime = item.createdAt;//返奖时间
                    live.balance = item.currentBalance;
                }
            }
        }
        for(let i =0; i < liveArr.length; i++) {
            let item = liveArr[i];
            item.balance = +(item.originalAmount + item.amount + item.reAmount).toFixed(2);
            delete item.businessKeys;
        }
        //流水createdAt+1操作
        for(let i = 0;i < list.length; i ++) {
            list[i].createdAt += i;
        }
        
        list = list.concat(liveArr);
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
                return m.userId == recordUser.parent;
            })

            if(!recordUser || !recordMerchant) {
                records.splice(i, 1);
                i --;
                continue;
            }

            if(gameType == "30000"){
                mix = recordUser.vedioMix ||  recordMerchant.vedioMix
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
                mix,
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
