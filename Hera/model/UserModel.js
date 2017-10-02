let  athena  = require("../lib/athena");
let {RoleCodeEnum} = require("../lib/Consts");
import {Model} from "../lib/Dynamo"
import {TABLE_NAMES} from "../config";
import {Util} from "../lib/Util"

import {CODES, CHeraErr} from "../lib/Codes";

export const State = {
    normal : 1,  //正常,
    forzen : 0 //冻结
}
const SexEnum = {
    man : 1,
    woman : 2
}
export const GameState = {  //游戏状态
    offline :1 ,//离线
    online : 2, //在线
    gameing : 3  //游戏中
}
export class UserModel extends athena.BaseModel {
    constructor({userName, userPwd, buId, state, merchantName,  msn, sex, gameState, nickname, headPic,remark, balance, liveMix, vedioMix, parent, parentName} = {}) {
        super(TABLE_NAMES.TABLE_USER);
        this.userName = userName;
        this.userPwd = userPwd;
        this.buId = buId ? +buId : -1;
        this.role = RoleCodeEnum.Player;
        this.state = state || State.normal;
        this.updateAt = Date.now();
        this.createAt = Date.now();
        this.merchantName = merchantName || Model.StringValue;
        this.balance = balance || 0;
        this.msn = msn;
        this.sex = sex || 0;
        this.remark = remark || Model.StringValue;
        this.nickname = nickname || Model.StringValue;
        this.headPic = headPic || Model.StringValue;
        this.gameState = gameState || GameState.offline;
        this.liveMix = liveMix || 0;
        this.vedioMix = vedioMix || 0;
        this.parent = parent;
        this.parentName = parentName;
        this.password = userPwd || Model.StringValue;
    }


    /**
     * 判断用户是否存在
     * @param {*} userName 
     */
    isExist(userName) {
        return super.isExist({userName});
    }
    findByBuIds(buIds, conditions = {}) {
        console.log("111111111111111111111111");
        let {userName, merchantName, nickname} = conditions;
        let filterExpression = "(",
            expressionAttributeValues = {},
            expressionAttributeNames = {};
        for(var i =0; i < buIds.length; i++){
            filterExpression += `#buId${i}=:buId${i} or `;
            expressionAttributeNames[`#buId${i}`] = "buId";
            expressionAttributeValues[`:buId${i}`] = buIds[i];
        }
        
        filterExpression = filterExpression.substring(0,filterExpression.length -3);
        filterExpression += ")";
        for(let key in conditions){
            if(userName || merchantName || nickname) {
                if(conditions[key]) {
                    filterExpression += `and contains(#${key},:${key}) `
                    expressionAttributeValues[`:${key}`] = conditions[key];
                    expressionAttributeNames[`#${key}`]  = key;
                }
            }
        }
       
        let scanOpts = {
            TableName : this.tableName,
            FilterExpression : filterExpression,
            ExpressionAttributeValues : expressionAttributeValues,
            ExpressionAttributeNames : expressionAttributeNames
        }
        console.log(scanOpts);
        return this.promise("scan", scanOpts);
    }
    async getUserByNickname(nickname) {
        let [scanErr, userList] = await this.scan({nickname});
        if(scanErr) return [scanErr, null];
        return [null, userList[0]]
    }
    isGames(user) {
        return user.gameState == GameState.gameing;
    }
    cryptoPassword(){
        this.userPwd = Util.sha256(this.userPwd);
    }
    updateGameState(userName, state){
        return this.update({userName}, {gameState: state})
    }
    async save(len, num){
        len = len || 6;
        num = num || -1;
        this.userId = Util.userId(len);
        let [err, userInfo] = await this.get({userId:this.userId}, [], "userIdIndex");
        num ++;
        if(err) return [err, 0];
        if(userInfo) { //重新找
            if(num%2 ==0) {
                num = 0;
                len ++;
            }
            return this.save(len, num);
        }else {
            return super.save();
        }
    }
    async playerList(conditions) {
        let {userName, merchantName, nickname} = conditions;
        let filterExpression = "";
        let expressionAttributeValues = {};
        let expressionAttributeNames = {};
        for(let key in conditions){
            if(key == "userName" || key == "merchantName" || key=="nickname") {
                if(conditions[key]) {
                    filterExpression += `contains(#${key},:${key}) and `
                    expressionAttributeValues[`:${key}`] = conditions[key];
                    expressionAttributeNames[`#${key}`]  = key;
                }
            }else {
                filterExpression += `#${key}=:${key} and `;
                expressionAttributeValues[`:${key}`] = conditions[key];
                expressionAttributeNames[`#${key}`]  = key;
            }
        }
        let scanOpts = {};
        if(filterExpression.length!=0){
            filterExpression = filterExpression.substr(0, filterExpression.length-4);
            scanOpts = {
                FilterExpression : filterExpression,
                ExpressionAttributeNames : expressionAttributeNames,
                ExpressionAttributeValues:expressionAttributeValues
            }
        }
        console.log(scanOpts);
        return this.promise("scan", scanOpts);
    }
    list(buId){
        let scanParams = {
            TableName : this.tableName,
            ReturnValues : ["userId", "userName","buId","updateAt","merchantName","balance", "msn","state"]
        }
        let FilterExpression = "";
        let ExpressionAttributeValues;
        if(buId){
            FilterExpression = "buId = :buId";
            ExpressionAttributeValues = {
                ":buId" : buId
            }
            Object.assign(scanParams,{FilterExpression, ExpressionAttributeValues});
        }
        return this.promise("scan", scanParams);
    }
    vertifyPassword(password){
        this.userPwd = Util.sha256(this.userPwd);
        return Object.is(password, this.userPwd);
    }
    
}