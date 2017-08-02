let {RoleCodeEnum} = require("../lib/Consts");

import { pushUserInfo } from "../lib/TcpUtil"
import {GameModel} from "./GameModel"


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
    push(){
        const port = 20003;
        const proId = 9;  //协议
        return pushUserInfo(this, host, port, proId);
    }
    setGameList(gameList){
        gameList = gameList || [];
        let list = gameList.map((game) => game.gameId);
        return list;
    }
}
