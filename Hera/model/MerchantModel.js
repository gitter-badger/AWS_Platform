let  athena  = require("../lib/athena");

import {TABLE_NAMES} from "../config";
export class MerchantModel extends athena.BaseModel {
    constructor({displayId, parent, rate, msn, userId} = {}) {
        super(TABLE_NAMES.TABLE_MERCHANT);
        this.displayId = this.displayId;
        this.parent = parent;
        this.rate = rate;
        this.userId = userId;
        this.msn = msn;
    }
    findById(displayId){
        if(!displayId) {
            return [null, null];
        }
        return this.get({
            displayId
        }, [], "merchantIdIndex");
    }
    findByUserId(userId) {
        return this.get({
            userId
        }, [], "UserIdIndex");
    }

    commission(){
        let parent = this.parent;
        return this.findParentCommission([this.rate], this.userId, parent);
    }
    /**
     * 获取所有的子代理
     * @param {*} uids 
     * @param {*} intoArray 
     */
    async agentChildListByUids(uids, intoArray = []) {
        let [parentsError, userList] = await this.findByParents(uids);  
        if(parentsError) return [parentsError, null];
        if(userList.length == 0) {
            return [null, intoArray];
        }else {
            uids = [];
            userList.map((item) => {
                intoArray.push(item);
                uids.push(item.userId);
            })
            return this.agentChildListByUids(uids, intoArray);
        }
    }

    async findByParents(uids){
        let filterExpression = "",
            expressionAttributeValues = {};
        for(var i =0; i < uids.length; i++){
            filterExpression += `parent=:userId${i} or `;
            expressionAttributeValues[`:userId${i}`] = uids[i];
        }
        filterExpression = filterExpression.substring(0, filterExpression.length -3);
        return this.promise("scan", {
                TableName : this.tableName,
                FilterExpression : filterExpression,
                ExpressionAttributeValues : expressionAttributeValues
            });
        // return new Promise((reslove, reject) => {
        //     this.db$("scan", {
        //         TableName : this.tableName,
        //         FilterExpression : filterExpression,
        //         ExpressionAttributeValues : expressionAttributeValues
        //     }).then((result) => {
        //         reslove([null, result.Items]);
        //     }).catch((err) => {
        //         reslove([err, []]);
        //     })
        // })
    }
    async findParentCommission(intoArray, userId, parent){
        if(Object.is(parent, "00") || Object.is(parent, "01")) {
            return [null, intoArray]
        }
        let [comissionError, mInfo] = await this.get({
            userId : parent
        }, [], "UserIdIndex");
        if(comissionError) return [comissionError ,null];
        if(!mInfo) return [null, intoArray];
        if(mInfo.rate) intoArray.push(mInfo.rate);
        return this.findParentCommission(intoArray, mInfo.userId, mInfo.parent);
    }
}