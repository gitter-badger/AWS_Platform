import {
    Tables,
    Store$,
    Codes,
    BizErr,
    RoleCodeEnum,
    GameStatusEnum,
    RoleModels,
    GameTypeEnum,
    Trim,
    Empty,
    Model,
    BillActionEnum,
    Keys,
    Pick,
    Omit
} from '../lib/all'
import _ from 'lodash'
import { BaseModel } from './BaseModel'

const tableName = "ZeusPlatformGame"
export class GameModel extends BaseModel {
    constructor() {
        super()
        // 设置表名
        this.params = {
            TableName: Tables.ZeusPlatformBill,
        }
        // 设置对象属性
        this.item = {
            ...this.baseitem,
            gameType: Model.StringValue,
            gameId: Model.StringValue
        }
    }

    /**
     * 添加游戏
     * @param {*} gameInfo 
     */
    async addGame(gameInfo) {
        const gameName = gameInfo.gameName
        const gameType = gameInfo.gameType
        const kindId = parseInt(gameInfo.kindId)

        if (!GameTypeEnum[gameType]) {
            return [BizErr.ParamErr('Game type not exist'), 0]
        }
        if (Trim(gameName).length < 1) {
            return [BizErr.ParamErr('Need a game name'), 0]
        }
        if (!_.isNumber(kindId)) {
            return [BizErr.ParamErr('kindId should provided and kindId cant parse to number')]
        }
        const query = {
            TableName: Tables.ZeusPlatformGame,
            IndexName: 'GameNameIndex',
            KeyConditionExpression: 'gameType = :gameType and gameName = :gameName',
            ExpressionAttributeValues: {
                ':gameName': gameName,
                ':gameType': gameType
            }
        }
        const [queryErr, queryRet] = await Store$('query', query)
        if (queryErr) {
            return [queryErr, 0]
        }
        if (queryRet.Items.length > 0) {
            return [BizErr.ItemExistErr(), 0]
        }
        const Game = {
            ...Model.baseModel(),
            ...gameInfo,
            gameId: Model.uuid()
        }
        const put = {
            TableName: Tables.ZeusPlatformGame,
            Item: Game
        }
        const [putErr, putRet] = await Store$('put', put)
        if (putErr) {
            return [putErr, 0]
        }
        return [0, putRet]
    }
}


