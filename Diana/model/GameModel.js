
import { Util, BaseModel } from 'athena'
const uid = require('uuid/v4')

const tableName = "ZeusPlatformGame"
export class GameModel extends BaseModel {
    constructor(gameType, gameId, createAt, updateAt) {
        super(tableName)
        this.gameType = gameType
        this.aggameIde = gameId
        this.createAt = createAt
        this.updateAt = updateAt
    }
}


