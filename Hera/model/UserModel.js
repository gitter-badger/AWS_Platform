let  athena  = require("../lib/athena");
let {RoleCodeEnum} = require("../lib/Consts");
import {Model} from "../lib/Dynamo"
import {TABLE_NAMES} from "../config";
import {Util} from "../lib/Util"

export const State = {
    normal : 1,  //正常,
    forzen : 0 //冻结
}
const SexEnum = {
    man : 1,
    woman : 2
}
export const PaymentState = {  //是否可以进行转账操作
    allow :1 ,//允许
    forbid : 2 //禁止（正在游戏中不能转账）
}
export class UserModel extends athena.BaseModel {
    constructor({userName, userPwd, buId, state, merchantName,  msn, sex, paymentState, nickname, headPic,remark, balance, liveMix, vedioMix, parent, parentName} = {}) {
        super(TABLE_NAMES.TABLE_USER);
        this.userName = userName;
        this.userPwd = userPwd;
        this.buId = buId ? +buId : -1;
        this.role = RoleCodeEnum.Player;
        this.state = state || State.normal;
        this.updateAt = Date.now();
        this.createdAt = Date.now();
        this.createAt = Date.now();
        this.merchantName = merchantName || Model.StringValue;
        this.balance = balance || 0;
        this.msn = msn;
        this.sex = sex || 0;
        this.remark = remark || Model.StringValue;
        this.nickname = nickname || Model.StringValue;
        this.headPic = headPic || Model.StringValue;
        this.payState = paymentState || PaymentState.allow;
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
    findByBuIds(buIds) {
        let filterExpression = "",
            expressionAttributeValues = {};
        for(var i =0; i < buIds.length; i++){
            filterExpression += `buId=:buId${i} or `;
            expressionAttributeValues[`:buId${i}`] = buIds[i];
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
    async getUserByNickname(nickname) {
        let [scanErr, userList] = await this.scan({nickname});
        if(scanErr) return [scanErr, null];
        return [null, userList[0]]
    }
    isGames(user) {
        return user.payState == PaymentState.forbid;
    }
    cryptoPassword(){
        this.userPwd = Util.sha256(this.userPwd);
    }
    updateGameState(userName, state){
        return this.update({userName}, {payState: state})
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
        return new Promise((reslove, reject) => {
            this.db$("scan", scanParams).then((result)=>{
                return reslove([null, result.Items]);
            }).catch((error) => {
                return reslove([error, 0]);
            })
        })
    }
    vertifyPassword(password){
        this.userPwd = Util.sha256(this.userPwd);
        return Object.is(password, this.userPwd);
    }
    
}