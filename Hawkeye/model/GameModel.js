let {RoleCodeEnum} = require("../lib/Consts");


import {BaseModel} from "../lib/athena"

import {
    Tables,
} from '../lib/all'



export class GameModel extends BaseModel{
    constructor({} = {}) {
        super(Tables.ZeusPlatformGame);
    }
    async findByKindId(kindId){
        let [gameErr, game] = await this.get({kindId}, [], "KindIdIndex");
        return [gameErr, game]
    }
}
