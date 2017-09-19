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
        if(userId) {
            filterExpression += "and #userId=:userId";
            expressionAttributeNames["#userId"] = "userId";
            expressionAttributeValues[":userId"] = userId;
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
}

