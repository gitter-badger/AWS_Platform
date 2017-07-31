let {RoleCodeEnum} = require("../lib/Consts");

import { pushUserInfo } from "../lib/TcpUtil"


const State = {
    normal : 1,  //正常,
    forzen : 2 //冻结
}

export class CSModel{
    constructor({username, role, userId, displayName,  headPic, parent, msn} = {}) {

        this.username = username;
        this.role = role;
        this.id = userId,
        this.nickName = displayName;
        this.headPic = headPic || "00";
        this.parentId = parent;
        this.msn = msn;
    }
    push(){
        console.log(this);
        return pushUserInfo(this);
    }
}
