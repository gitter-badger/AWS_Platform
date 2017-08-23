let {RoleCodeEnum} = require("../lib/all");

import { pushUserInfo, pushUserBalance, pushId } from "../lib/TcpUtil"


const State = {
    normal : 1,  //正常,
    forzen : 2 //冻结
}
// const host = '192.168.3.98';
const host = '47.88.192.69';
const port = 20003;
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
        const proId = 9;  //协议
        console.info(this);
        return pushUserInfo(this, host, port, proId);
    }
    setGameList(gameList){
        gameList = gameList || [];
        let list = gameList.map((game) => game.code);
        return list;
    }
    pushUserBalance(userId) {
        const proId = 8;  //协议
        return pushUserBalance(userId+"", host, port, proId);
    }
    //公告推送
    pushGameNotice(noid) {
        const proId = 1;  //协议
        return pushId(noid, host, port, proId);
    }
    //公告推送
    pushGameEamil(emid) {
        const proId = 2;  //协议
        return pushId(emid, host, port, proId);
    }
}