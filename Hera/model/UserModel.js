let  athena  = require("../lib/athena");
import {TABLE_NAMES} from "../config";
import {Util} from "../lib/Util"

const State = {
    normal : 1,  //正常,
    forzen : 2 //冻结
}

export class UserModel extends athena.BaseModel {
    constructor({userName, userPwd, buId, state}) {
        super(TABLE_NAMES.TABLE_USER);
        this.userId = Util.uuid();
        this.userName = userName;
        this.userPwd = userPwd;
        this.buId = buId;
        this.state = state || State.normal;
        this.updateAt = Date.now();
        this.createAt = Date.now();
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
    vertifyPassword(password){
        this.userPwd = Util.sha256(this.userPwd);
        return Object.is(password, this.userPwd);
    }
}