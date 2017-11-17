let  athena  = require("../lib/athena");
let {RoleCodeEnum} = require("../lib/all");
import {TABLE_NAMES} from "../config";

import {Codes, CHeraErr} from "../lib/Codes"


export class BillStatModel extends athena.BaseModel {
    constructor({userId, dateStr, fromRole,amount,role,gameType,type} = {}) {
        super(TABLE_NAMES.BILL_STAT);
        this.userId = userId;
        this.dateStr = dateStr;
        this.role = role;
        this.type = type;  //1，日统计，2，月统计,3,所有用户日统计
        this.amount = amount;
        this.gameType = gameType;
    }
    findGameConsume(startTime, endTime, role, type, userId){
        let keyConditionExpression = "#type=:type and #role=:role";
        let filterExpression = "#createdAt between :startTime and :endTime ";
        let expressionAttributeNames = {
            "#type" : "type",
            "#role" : "role",
            "#createdAt" : "createdAt",
        }
        let expressionAttributeValues = {
            ":type" : type,
            ":role" : role,
            ":startTime" : startTime,
            ":endTime" : endTime,
        };
        if(userId && typeof userId == "string") {
            filterExpression += "and #userId=:userId";
            expressionAttributeNames["#userId"] = "userId";
            expressionAttributeValues[":userId"] = userId;
        }
        if(userId && typeof userId == "object") {
            filterExpression += "and ("
            expressionAttributeNames["#userId"] = "userId";
            for(let i = 0; i < userId.length; i ++) {
                if(i == userId.length -1) {
                    filterExpression += `#userId=:userId${i})`
                }else {
                    filterExpression += `#userId=:userId${i} or `
                }
                expressionAttributeValues[`:userId${i}`] = userId[i];
            }
        }
  
        return new Promise((reslove, reject) => {
            this.db$("query", {
                IndexName : "roleTypeIndex",
                KeyConditionExpression: keyConditionExpression,
                FilterExpression : filterExpression,
                ExpressionAttributeNames :expressionAttributeNames,
                ExpressionAttributeValues: expressionAttributeValues
            }).then((result) => {
                result = result || {};
                result.Items = result.Items || [];
                return reslove([null, result.Items]);
            }).catch((err) => {
                console.log(err);
                return reslove([new CHeraErr(Codes.DBError), null]);
            });
        })
    }
    /**
     * 批量保存
     * @param {*} records 
     */
    batchWrite(records) {
        let  createdDate = this.parseDay(new Date()),promises = [];
        for(let i =0; i < records.length; i += 25) {
            let batch = {
                "RequestItems":{
                    "BillStat" : []
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
            batch.RequestItems.BillStat = saveArray;
            promises.push(this.db$("batchWrite", batch));
        }
        console.log("-----------------");
        console.log(records.length);
        console.log(promises.length);
        console.log("promise开始："+Date.now());
        Promise.all(promises).then((result) => {
            // console.log(result);
            let unArray = [];
            for(let i =0; i < result.length; i++) {
                let r = result[i];
                if(r.UnprocessedItems.BillStat) {
                    unArray = unArray.concat(r.UnprocessedItems.BillStat);
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
            console.log("插入失败");
            console.log("批量写入后："+Date.now());
            console.log(records);
            console.log(err);
        });
        console.log("promise结束："+Date.now());
    }
}

