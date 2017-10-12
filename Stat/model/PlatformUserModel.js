let  athena  = require("../lib/athena");

import {Tables} from "../lib/Dynamo"

import {RoleCodeEnum} from "../lib/all";

import {Codes, BizErr} from "../lib/Codes";

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
    //商户数量
    merchantCount(startTime, buIds, role){
        let opts = {
            TableName : this.tableName,
            FilterExpression : "#role=:role",
            ExpressionAttributeNames :{
                "#role" : "role"
            },
            ExpressionAttributeValues : {
                ":role" : role || RoleCodeEnum.Merchant
            }
        }
        if(startTime) {
            opts.FilterExpression += " and createdAt> :createdAt";
            opts.ExpressionAttributeValues[":createdAt"] = startTime
        }
        return new Promise((reslove, reject) => {
            this.db$("scan", opts, ["msn,userId","parent"]).then((result) => {
                if(role == RoleCodeEnum.Agent) {
                    for(let i = 0; i < result.Items.length; i++) {
                        let item = result.Items[i];
                        if(item.parent == "00") {
                            result.Items.splice(i, 1);
                            i --;
                        }
                    }
                }
                if(!buIds) {
                    return reslove([null,  result.Items.length]);
                } else {
                    let count = 0;
                    result.Items.forEach(function(element) {
                        if(buIds.indexOf(element.userId)!=-1) {
                            count ++;
                        }
                    }, this);
                    return reslove([null,  count]);
                }
                
            }).catch((err) => {
                console.log(err);
                return reslove([err, 0]);
            })
        })
    }
    async childrenMerchant(userId) {
        let opts = {
            FilterExpression : "contains(#levelIndex, :userId) and #role=:role",
            ExpressionAttributeValues : {
                ":userId" : userId,
                ":role" : RoleCodeEnum.Merchant
            },
            ExpressionAttributeNames : {
                "#levelIndex" : "levelIndex",
                "#role" : "role"
            },
            ProjectionExpression : "userId"
        }
        console.log(opts);
        return new Promise((reslove, reject) => {
            this.db$("scan", opts).then((result) => {
                result = result || {};
                result.Items = result.Items || [];
                return reslove([null, result.Items]);
            }).catch((err) => {
                console.log(err);
                return reslove([BizErr.DBErr(), null]);
            });
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