let {RoleCodeEnum} = require("../lib/Consts");

import { pushUserInfo } from "../lib/TcpUtil"


const State = {
    normal : 1,  //正常,
    forzen : 2 //冻结
}
const host = '47.88.192.69';
// const host = '192.168.3.98';
export class PushModel{
    constructor({username, role, userId, displayName,  headPic, parent, msn, gameList} = {}) {
        this.username = username;
        this.role = role;
        this.id = userId,
        this.nickname = displayName;
        this.headPic = headPic || "";
        this.parentId = parent;
        this.msn = msn;
        this.gameList = this.setGameList(gameList)
    }
    pushMerchant(){
        const port = 20003;
        const proId = 9;  //协议
        console.info(this);
        return pushUserInfo(this, host, port, proId);
    }
    setGameList(gameList){
        gameList = gameList || [];
        let list = gameList.map((game) => game.code);
        return list;
    }
    pushUserBalance(obj) {
        const port = 20002;
        const proId = 9;  //协议
        return pushUserInfo(obj, host, port, proId);
    }
}