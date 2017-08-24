let {RoleCodeEnum} = require("../lib/Consts");

import {Util} from "../lib/Util"
import {CODES, CHeraErr} from "../lib/Codes";


import {BaseModel} from "../lib/athena"

import {
    Tables,
} from '../lib/all'

// private String gameTable;
// 	private String gameName;
// 	// 靴数（0++）
// 	private String bootsNum;
// 	// 局数（0++）
// 	private String roundNum;
// 	// 结算赔率
// 	private BigDecimal settleRate;
// 	// 下注前余额
// 	private BigDecimal preBalance;
// 	// 投注时间
// 	private String betTime;
// 	// 结算时间
// 	private String settleTime;
// 	// 代理名
// 	private String agentName;
// 	// 用户名
// 	private String userName;
// 	// 桌子ID
// 	private Integer tableId;
// 	// 桌子类型
// 	private Integer tableType;
// 	// 游戏ID
// 	private Integer gameId;
// 	// 局ID
// 	private String roundId;
// 	// 局结果
// 	private String result;
// //	// 开奖结果
// //	private String roundResult;
// 	// 交易项KEY
// 	private String itemKey;
// 	// 交易项名称
// 	private String itemName;
// 	// 交易项ID
// 	private long itemId;
// 	// 投注编号
// 	private String betId;
// 	// 轮盘投注详情（API输出文档无需体现）
// 	private String addition;
// 	// 投注类型ID
// 	private String betTypeId;
// 	// 下注金额
// 	private BigDecimal betAmount;
// 	// 投注号码
// 	private String betNum;
// 	// 输赢状态：1 输 2 赢 3 和 0 取消
// 	private Integer winLostStatus;
// 	// 输赢金额（不含本金，输为负数，赢为正数）
// 	private BigDecimal winLostAmount;
// 	// 本局结算后金额
// 	private BigDecimal settleAfterBalance;
// 	// 用户ID
// 	private Long userId;
// 	// 下注金额
// 	private BigDecimal amount;


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
                resolve([new CHeraErr(CODES.SystemError), null])
            });
        })
    }
    async page(currPage, pageSize, parentId, userName, startTime, endTime, lastTime) {
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
        if(userName) {
            opts.FilterExpression = "userName=:userName",
            opts.ExpressionAttributeValues[":userName"] = userName;
        }
        let [countErr, count] = await this.count(opts);
        if(countErr) {
            return [countErr, null]
        }
        let page = {
            total : count,
            currPage: currPage,
            pageSize : pageSize,
            list : []
        }
        opts.Limit = pageSize;
        let [pageErr] = await this.findRecords(opts, page);
        page.pageSize = page.list.length;
        page.list.forEach((item, index) => {
            page.list[index] = page.list[index].record;
        })
        if(pageErr){
            return [pageErr, records];
        }
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
