let  athena  = require("../lib/athena");

import {Tables} from "../lib/Dynamo"

import {RoleCodeEnum} from "../lib/Consts";

import {CODES, CHeraErr} from "../lib/Codes";

const sumLineMerchantCount = 999;

export class PlatformUserModel extends athena.BaseModel {
    constructor(){
        super(Tables.ZeusPlatformUser);
    }
    //线路上数量
    lineMerchantCount(){
        let opts = {
            TableName : this.tableName,
            FilterExpression : "#role=:role",
            ExpressionAttributeNames :{
                "#role" : "role"
            },
            ExpressionAttributeValues : {
                ":role" : RoleCodeEnum.Agent
            }
        }
        return new Promise((reslove, reject) => {
            this.db$("scan", opts, ["msn"]).then((result) => {
                return reslove([null, {sum:sumLineMerchantCount, num:result.Items.length}]);
            }).catch((err) => {
                console.log(err);
                return reslove([err, {sum:0,num:0}]);
            })
        })
    }
    findByUids(uids){
        let filterExpression = "",
            expressionAttributeValues = {};
        for(var i =0; i < uids.length; i++){
            filterExpression += `userId=:userId${i} or `;
            expressionAttributeValues[`:userId${i}`] = uids[i];
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