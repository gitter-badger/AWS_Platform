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
            TableName: Tables.ZeusPlatformGame,
        }
        // 设置对象属性
        this.item = {
            ...this.baseitem,
            gameType: Model.StringValue,
            gameId: Model.uuid()
        }
    }

    /**
     * 添加游戏
     * @param {*} gameInfo 
     */
    async addGame(gameInfo) {
        const gameName = gameInfo.gameName
        const gameType = gameInfo.gameType
        const gameStatus = parseInt(gameInfo.gameStatus)
        const kindId = parseInt(gameInfo.kindId)
        // 参数合法性校验
        if (!GameTypeEnum[gameType]) {
            return [BizErr.ParamErr('Game type not exist'), 0]
        }
        if (Trim(gameName).length < 1) {
            return [BizErr.ParamErr('Need a game name'), 0]
        }
        if (!_.isNumber(kindId)) {
            return [BizErr.ParamErr('kindId should provided and kindId cant parse to number')]
        }
        if (!_.isNumber(gameStatus) || (parseInt(gameStatus) < 0 || parseInt(gameStatus) > 4)) {
            return [BizErr.ParamErr('gameStatus should provided 0/1/2/3/4')]
        }
        // 判断是否重复
        const [existErr, exist] = await this.isExist({
            IndexName: 'GameNameIndex',
            KeyConditionExpression: 'gameType = :gameType and gameName = :gameName',
            ExpressionAttributeValues: {
                ':gameName': gameName,
                ':gameType': gameType
            }
        })
        if (existErr) {
            return [existErr, 0]
        }
        if (exist) {
            return [BizErr.ItemExistErr(), 0]
        }
        // 保存
        const [putErr, putRet] = await this.putItem({
            ...this.item,
            ...gameInfo
        })
        if (putErr) {
            return [putErr, 0]
        }
        return [0, putRet]
    }

    /**
     * 游戏列表
     * @param {*} pathParams 
     */
    async listGames(pathParams) {
        if (Empty(pathParams)) {
            return [BizErr.ParamMissErr(), 0]
        }
        const inputTypes = pathParams.gameType.split(',')
        const gameTypes = _.filter(inputTypes, (type) => {
            return !!GameTypeEnum[type]
        })
        if (gameTypes.length === 0) {
            return [BizErr.ParamErr('game type is missing'), 0]
        }
        // 组装条件
        const ranges = _.map(gameTypes, (t, index) => {
            return `gameType = :t${index}`
        }).join(' OR ')
        const values = _.reduce(gameTypes, (result, t, index) => {
            result[`:t${index}`] = t
            return result
        }, {})
        console.info(values)
        const [err, ret] = await this.scan({
            IndexName: 'GameTypeIndex',
            FilterExpression: ranges,
            ExpressionAttributeValues: values
        })
        if (err) {
            return [err, 0]
        }
        return [0, ret]
    }

    /**
     * 更新游戏状态
     * @param {游戏类型} gameType 
     * @param {游戏ID} gameId 
     * @param {需要变更的状态} status 
     */
    changeStatus(gameType, gameId, status) {
        return new Promise((reslove, reject) => {
            const params = {
                ...this.params,
                Key: {
                    'gameType': gameType,
                    'gameId': gameId
                },
                UpdateExpression: "SET gameStatus = :status",
                ExpressionAttributeValues: {
                    ':status': status
                }
            }
            this.db$('update', params)
                .then((res) => {
                    return reslove([0, res])
                }).catch((err) => {
                    return reslove([BizErr.DBErr(err.toString()), 0])
                })
        })
    }
}


