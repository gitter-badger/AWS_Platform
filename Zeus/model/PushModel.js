let {RoleCodeEnum} = require("../lib/Consts");

import { pushUserInfo } from "../lib/TcpUtil"
import {GameModel} from "./GameModel"


const State = {
    normal : 1,  //正常,
    forzen : 2 //冻结
}

export class PushModel{
    constructor({username, role, userId, displayName,  headPic, parent, msn, gameList} = {}) {
        this.username = username;
        this.role = role;
        this.id = userId,
        this.nickName = displayName;
        this.headPic = headPic || "";
        this.parentId = parent;
        this.msn = msn;
        this.gameList = this.setGameList(gameList)
    }
    push(){
        return pushUserInfo(this);
    }
    setGameList(gameList){
        gameList = gameList || [];
        let list = gameList.map((game) => game.gameId);
        return list;
    }
}
