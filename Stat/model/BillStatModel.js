let  athena  = require("../lib/athena");
let {RoleCodeEnum} = require("../lib/all");
import {TABLE_NAMES} from "../config";

const State = {
    normal : 1,  //正常,
    forzen : 2 //冻结
}

export class BillStatModel extends athena.BaseModel {
    constructor({userId, dateStr, fromRole,amount,role,gameType,type} = {}) {
        super(TABLE_NAMES.BILL_STAT);
        this.userId = userId;
        this.dateStr = dateStr;
        this.role = role;
        this.type = type;
        this.amount = amount;
        this.gemeType = gameType;
    }
    findGameConsume(startTime, endTime){
        let keyConditionExpression = "#type=:type and #role=:role";
        let filterExpression = "#createdAt between :startTime and :endTime and #userId=:userId";
        let expressionAttributeNames = {
            "#type" : "type",
            "#role" : "role",
            "#createdAt" : "createdAt",
            "#userId" : "userId"
        }
        let expressionAttributeValues = {
            ":type" : 1,
            ":role" : "10000",
            ":startTime" : startTime,
            ":endTime" : endTime,
            ":userId" : "ALL_USER"
        };
        return new Promise((reslove, reject) => {
            this.db$("query", {
                IndexName : "roleTypeIndex",
                KeyConditionExpression: keyConditionExpression,
                FilterExpression : filterExpression,
                ExpressionAttributeNames :expressionAttributeNames,
                ExpressionAttributeValues: expressionAttributeValues,
                IndexName: indexName,
                ReturnValues: returnValues.join(",")
            }).then((result) => {
                result = result || {};
                result.Items = result.Items || [];
                return reslove([null, result.Items]);
            }).catch((err) => {
                console.log(err);
                return reslove([new AError(CODES.DB_ERROR, err.stack), null]);
            });
        })
    }
}

