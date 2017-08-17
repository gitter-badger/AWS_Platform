/**
 * 游戏公告
 */
let  athena  = require("../lib/athena");
import {Tables} from "../lib/Dynamo"
import {Util} from "../lib/Util";


export class ToolModel extends athena.BaseModel {
    constructor({} = {}) {
        super(Tables.DianaPlatformTool);
    }
    findByIds(tollIds) {
        let filterExpression = "",
            expressionAttributeValues = {};
        for(var i =0; i < tollIds.length; i++){
            filterExpression += `toolId=:toolId${i} or `;
            expressionAttributeValues[`:toolId${i}`] = tollIds[i];
        }
        filterExpression = filterExpression.substring(0, filterExpression.length -3);
        return new Promise((reslove, reject) => {
            this.db$("scan", {
                TableName : this.tableName,
                FilterExpression : filterExpression,
                ExpressionAttributeValues : expressionAttributeValues
            }).then((result) => {
                reslove([null, result.Items]);
            }).catch((err) => {
                reslove([err, 0]);
            })
        })
    }
}