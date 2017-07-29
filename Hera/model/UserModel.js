let  athena  = require("../lib/athena");
let {RoleCodeEnum} = require("../lib/Consts");
import {TABLE_NAMES} from "../config";
import {Util} from "../lib/Util"

const State = {
    normal : 1,  //正常,
    forzen : 2 //冻结
}

export class UserModel extends athena.BaseModel {
    constructor({userName, userPwd, buId, state, merchantName,  msn} = {}) {
        super(TABLE_NAMES.TABLE_USER);
        this.userId = Util.uuid();
        this.userName = userName;
        this.userPwd = userPwd;
        this.buId = +buId;
        this.role = RoleCodeEnum.Player;
        this.state = state || State.normal;
        this.updateAt = Date.now();
        this.createAt = Date.now();
        this.merchantName = merchantName;
        this.balance = 0;
        this.msn = msn;
    }


    /**
     * 判断用户是否存在
     * @param {*} userName 
     */
    isExist(userName) {
        return super.isExist({userName});
    }
    cryptoPassword(){
        this.userPwd = Util.sha256(this.userPwd);
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