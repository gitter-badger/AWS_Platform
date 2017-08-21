let {RoleCodeEnum} = require("../lib/Consts");

import {Util} from "../lib/Util"


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
    constructor({record, userId, userName,betTime, betId} = {}) {
        super(Tables.HeraGameRecord);
        this.userId = userId; //用户ID
        this.userName = userName; //用户名
        this.betId = betId;  //投注编号
        this.betTime = betTime;  //投注时间
        this.record = record; //记录，包含所有的详情
    }
    async batchWrite(records) {
        let batch = {
            "RequestItems":{
                "HeraGameRecord" : []
            } 
        }
        let saveArray = records.map((item) => {
            return {
                PutRequest : {
                    Item : item
                }
            }
        })
        batch.RequestItems.HeraGameRecord = saveArray;
        return new Promise((resolve, reject) => {
            this.db$("batchWrite", batch).then((result) => {
                resolve([null, result])
            }).catch((err) => {
                console.log(err);
                resolve([null,null]);
            });
        })
        
    }
}
