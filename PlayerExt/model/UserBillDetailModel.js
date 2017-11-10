let  athena  = require("../lib/athena");
import {TABLE_NAMES} from "../config";
import {Util} from "../lib/Util"


import {CODES, CHeraErr} from "../lib/Codes";

import {Model} from "../lib/Dynamo"



export class UserBillDetailModel extends athena.BaseModel {
    constructor({sn, gameId, billId} = {}) {
        super(TABLE_NAMES.PlayerBillDetail);
        this.sn = sn;
        this.gameId = gameId;
        this.billId = billId;
    }
    /**
     * 批量保存
     * @param {*} records 
     */
    batchWrite(records) {
        let sumBatch= [];
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
                    item.createdDate = this.parseDay(new Date(item.createdAt));
                    saveArray.push({
                        PutRequest : {
                            Item : item
                        }
                    })
                }
            }
            batch.RequestItems.PlayerBillDetail = saveArray;
            sumBatch.push(batch);
        }

        let promises = sumBatch.map((b)  => this.db$("batchWrite", b));
        
        Promise.all(promises).then((result) => {
            console.log("插入账单明细成功");
        }).catch((err) => {
            console.log("插入账单明细失败");
            console.log(err);
        });
        
    }
    /**
     * 账单流水明细
     * @param {*} userName 
     * @param {*} startTime 
     * @param {*} endTime 
     */
    billFlow(userName, startTime, endTime, type, action) {
        let opts = {
            IndexName : "UserNameIndex",
            ScanIndexForward :false,
            ProjectionExpression : ["sn","createdAt","#type","originalAmount","amount","balance","businessKey","remark","betId","userName"].join(","),
            KeyConditionExpression : "createdAt between :startTime and :endTime and userName=:userName",
            ExpressionAttributeValues : {
                ":startTime":startTime,
                ":endTime" :endTime,
                ":userName" :userName
            },
            ExpressionAttributeNames : {
                "#type" : "type"
            }
        }
        if(type || action) {
            opts.FilterExpression = "";
            if(type) {
                type = + type;
                opts.FilterExpression = "#type=:type and ";
                opts.ExpressionAttributeValues[":type"] = type;
            }
            if(action) {
                action += action;
                if(action > 0) {
                    opts.FilterExpression = "amount>:amount1";
                    opts.ExpressionAttributeValues[":amount1"] = -0.00001;
                }else {
                    opts.FilterExpression = "amount<:amount2"
                    opts.ExpressionAttributeValues[":amount2"] = 0;
                }
            }else {
                opts.FilterExpression = opts.FilterExpression.substring(0, opts.FilterExpression.length-4);
            }
        }
        return new Promise((reslove, reject) => {
            this.db$("query", opts).then((result) => {
                reslove([null, result.Items]);
            }).catch((err) => {
                console.log(err);
                reslove([new CHeraErr(CODES.SystemError, err.stack), null]);
            });
        })
    }
    /**
     * 账单流水详情
     * @param {*} billId 
     */
    billDetail(billId) {
        let opts = {
            IndexName : "BillIdIndex",
            ScanIndexForward :false,
            KeyConditionExpression : "billId=:billId",
            ProjectionExpression : ["sn", "createdAt","originalAmount","amount","reAmount","reTime","rat","mix","balance","#type","businessKey"].join(","),
            ExpressionAttributeValues : {
                ":billId":billId
            },
            ExpressionAttributeNames : {
                "#type":"type"
            }
        }
        return new Promise((reslove, reject) => {
            this.db$("query", opts).then((result) => {
                reslove([null, result.Items]);
            }).catch((err) => {
                console.log(err);
                reslove([new CHeraErr(CODES.SystemError, err.stack), null]);
            });
        })
    }
}
