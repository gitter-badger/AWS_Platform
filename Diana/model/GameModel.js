import {
    Tables,
    Store$,
    Codes,
    BizErr,
    Trim,
    Empty,
    Model,
    Keys,
    Pick,
    Omit,
    RoleCodeEnum,
    GameTypeEnum,
    RoleModels
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
        // 数据类型处理
        gameInfo.gameType = gameInfo.gameType.toString()
        gameInfo.gameStatus = GameStatusEnum.Online;
        gameInfo.gameRecommend = gameInfo.gameRecommend || Model.StringValue
        gameInfo.gameImg = gameInfo.gameImg || Model.StringValue
        gameInfo.company = gameInfo.company || Model.StringValue
        gameInfo.ip = gameInfo.ip || Model.StringValue
        gameInfo.port = gameInfo.port || Model.StringValue
        // 判断是否重复
        const [existErr, exist] = await this.isExist({
            IndexName: 'GameNameIndex',
            KeyConditionExpression: 'gameType = :gameType and gameName = :gameName',
            ExpressionAttributeValues: {
                ':gameType': gameInfo.gameType,
                ':gameName': gameInfo.gameName
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
                    ':status': parseInt(status)
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
    /**
     * 查询单个游戏
     * @param {*} gameType 
     * @param {*} gameId 
     */
    getOne(gameType, gameId) {
        return new Promise((reslove, reject) => {
            const params = {
                ...this.params,
                KeyConditionExpression: 'gameType = :gameType and gameId = :gameId',
                ExpressionAttributeValues: {
                    ':gameType': gameType,
                    ':gameId': gameId
                }
            }
            this.db$('query', params)
                .then((res) => {
                    if (res.Items.length > 0) {
                        res = res.Items[0]
                    }
                    return reslove([0, res])
                }).catch((err) => {
                    return reslove([BizErr.DBErr(err.toString()), false])
                })
        })
    }
}


