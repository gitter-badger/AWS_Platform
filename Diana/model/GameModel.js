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
    GameStatusEnum,
    RoleModels
} from '../lib/all'
import _ from 'lodash'
import { BaseModel } from './BaseModel'

export class GameModel extends BaseModel {
    constructor() {
        super()
        // 设置表名
        this.params = {
            TableName: Tables.DianaPlatformGame,
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
        const item = {
            ...this.item,
            ...gameInfo
        }
        const [putErr, putRet] = await this.putItem(item)
        if (putErr) {
            return [putErr, 0]
        }
        return [0, item]
    }

    /**
     * 游戏列表
     * @param {*} pathParams 
     */
    async listGames(pathParams) {
        const inputTypes = pathParams.gameType.split(',')
        const gameTypes = _.filter(inputTypes, (type) => {
            return !!GameTypeEnum[type]
        })
        if (gameTypes.length === 0) {
            return [BizErr.ParamErr('game type is missing'), 0]
        }
        // 组装条件
        let ranges = _.map(gameTypes, (t, index) => {
            return `gameType = :t${index}`
        }).join(' OR ')
        ranges += ' AND gameStatus <> :gameStatus'
        const values = _.reduce(gameTypes, (result, t, index) => {
            result[`:t${index}`] = t
            return result
        }, {})
        values[':gameStatus'] = 0
        const [err, ret] = await this.scan({
            IndexName: 'GameTypeIndex',
            FilterExpression: ranges,
            ScanIndexForward: false,
            ExpressionAttributeValues: values
        })
        if (err) {
            return [err, 0]
        }
        return [0, ret.Items]
    }

    /**
     * 更新游戏状态
     * @param {游戏类型} gameType 
     * @param {游戏ID} gameId 
     * @param {需要变更的状态} status 
     */
    async changeStatus(gameType, gameId, status) {
        const [err, ret] = await this.updateItem({
            ...this.params,
            Key: {
                'gameType': gameType,
                'gameId': gameId
            },
            UpdateExpression: "SET gameStatus = :status",
            ExpressionAttributeValues: {
                ':status': parseInt(status)
            }
        })
        return [err, ret]
    }
    /**
     * 查询单个游戏
     * @param {*} gameType 
     * @param {*} gameId 
     */
    async getOne(gameType, gameId) {
        const [err, ret] = await this.query({
            KeyConditionExpression: 'gameType = :gameType and gameId = :gameId',
            ExpressionAttributeValues: {
                ':gameType': gameType,
                ':gameId': gameId
            }
        })
        if (err) {
            return [err, 0]
        }
        if (ret.Items.length > 0) {
            return [0, ret.Items[0]]
        } else {
            return [0, 0]
        }
    }
}


