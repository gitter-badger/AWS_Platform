let {RoleCodeEnum} = require("../lib/Consts");


import {BaseModel} from "../lib/athena"

import {
    Tables,
} from '../lib/all'



export class UserOnlineRecord extends BaseModel{
    constructor({userId, userName, type, gameId} = {}) {
        super(Tables.UserOnlineRecord);
        this.userId = userId;
        this.userName = userName;
        this.type = type;   //1 进入游戏 2，退出游戏
        this.createdAt = Date.now();
        this.gameId = gameId;
    }
}
