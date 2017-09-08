let {RoleCodeEnum} = require("../lib/Consts");

import {Util} from "../lib/Util"
import {CODES, CHeraErr} from "../lib/Codes";


import {BaseModel} from "../lib/athena"

import {
    Tables,
} from '../lib/all'

export class GameRecordModel extends BaseModel{
    constructor({record, userId, userName,betTime, betId, gameId, parentId} = {}) {
        super(Tables.HeraGameRecord);
        this.userId = userId; //用户ID
        this.userName = userName; //用户名
        this.gameId = gameId;
        this.betId = betId;  //投注编号
        this.betTime = betTime;  //投注时间
        this.parentId = parentId; //上一级ID
        this.record = record; //记录，包含所有的详情
    }
    async batchWrite(records) {
        let sumBatch= [];
        for(let i =0; i < records.length; i+=25) {
            let batch = {
                "RequestItems":{
                    "HeraGameRecord" : []
                } 
            }
            let saveArray = [];
            for(let j = i; j< i+25;j ++){
                let item = records[j]
                if(item) {
                    saveArray.push({
                        PutRequest : {
                            Item : item
                        }
                    })
                }
            }
            batch.RequestItems.HeraGameRecord = saveArray;
            sumBatch.push(batch);
        }

        let promises = sumBatch.map((b)  => this.db$("batchWrite", b));

        return new Promise((resolve, reject) => {
            Promise.all(promises).then((result) => {
                resolve([null, result])
            }).catch((err) => {
                console.log(err);
                resolve([new CHeraErr(CODES.SystemError), null])
            });
        })
    }
    async page(pageSize, parentId, userName, gameId, startTime, endTime, lastTime) {
        //找到总数
        let opts = {
            IndexName : "parentIdIndex",
            ScanIndexForward :false,
            KeyConditionExpression : "betTime between :startTime and :endTime and parentId=:parentId",
            ExpressionAttributeValues : {
                ":startTime":startTime,
                ":endTime" :endTime,
                ":parentId" :parentId
            }
        }
        if(userName || gameId) {
            opts.FilterExpression = "";
        }
        if(userName) {
            opts.FilterExpression += "userName=:userName ",
            opts.ExpressionAttributeValues[":userName"] = userName;
        }
        if(gameId) {
            if(userName) {
                opts.FilterExpression += "and gameId=:gameId";
            }else {
                opts.FilterExpression += "gameId=:gameId";
            }
            opts.ExpressionAttributeValues[":gameId"] = gameId;
        }
        let [countErr, count] = await this.count(opts);
        if(countErr) {
            return [countErr, null]
        }
        let page = {
            total : count,
            pageSize : pageSize,
            list : []
        }
        opts.Limit = 1000;
        if(lastTime) {
            opts.ExpressionAttributeValues[":endTime"] = lastTime-1;
        }
        let [pageErr] = await this.findRecords(opts, page);
        if(pageErr){
            return [pageErr, page];
        }
        page.pageSize = page.list.length;
        page.lastTime = (page.list[0] || {}).betTime || 0;
        page.list.forEach((item, index) => {
            page.list[index] = page.list[index].record;
        })
        
        return [pageErr, page];
    }
    async findRecords(opts, page) {
        let [dbErr, result] = await this.db(opts);
        if(dbErr) {
            console.log(dbErr);
            return [dbErr, null];
        }
        let lastRecord = result.LastEvaluatedKey;
        page.list = page.list.concat(page.list, result.Items);
        if(page.list.length >= page.pageSize) {
            page.list = page.list.slice(0, page.pageSize)
            return [null, page]
        } else if(lastRecord) {
            opts.ExpressionAttributeValues[":startTime"] = lastRecord.betTime+1;
            return this.findRecords(opts, page);
        } else {
            return [null, page];
        }
    }
    async db(opts) {
        return new Promise((reslove, reject) => {
            this.db$("query", opts).then((result) => {
                reslove([null, result]);
            }).catch((err) => {
                console.log(err);
                reslove([new CHeraErr(CODES.SystemError, err.stack), null]);
            });
        })
    }
    async count(opts){
        opts.Select = "COUNT";
        return new Promise((reslove, reject) => {
            this.db$("query", opts).then((result) => {
                delete opts.Select
                reslove([null, result.Count])
            }).catch((err) => {
                console.log(err);
                delete opts.Select
                reslove([new CHeraErr(CODES.SystemError, err.stack), null]);
            });
        })
    }
       
}
