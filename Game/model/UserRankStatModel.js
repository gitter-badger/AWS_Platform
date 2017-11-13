import { Tables, Store$, Codes, BizErr, Trim, Empty, Model, Keys, Pick, Omit, RoleCodeEnum, RoleModels } from '../lib/all'
import { BaseModel } from './BaseModel'
import _ from 'lodash'

export class UserRankStatModel extends BaseModel {
    constructor() {
        super()
        // 设置表名
        this.params = {
            TableName: Tables.UserRankStat,
        }
        // 设置对象属性
        this.item = {
            ...this.baseitem
        }
    }

    /**
     * 更新数据
     */
    async updateRank(inparam) {
        let query = {
            KeyConditionExpression: '#userId = :userId',
            ExpressionAttributeNames: {
                '#userId': 'userId'
            },
            ExpressionAttributeValues: {
                ':userId': inparam.userId
            }
        }
        const [err, ret] = await this.query(query)
        let bet = inparam.betCount
        let win = inparam.winCount
        if (ret.Items && ret.Items.length > 0) {
            const record = ret.Items[0]
            bet += record.bet
            win += record.win
        }
        this.putItem({
            ...this.item,
            userId: inparam.userId,
            balance: inparam.balance,
            bet: bet,
            win: win
        }).then((res) => {
            console.log('结果')
            console.log(res)
        }).catch((err) => {
            console.error(err)
        })
    }
}
