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
        console.log(inparam)
        let query = {
            KeyConditionExpression: '#userId = :userId',
            ExpressionAttributeNames: {
                '#userId': 'userId'
            },
            ExpressionAttributeValues: {
                ':userId': inparam.userId.toString()
            }
        }
        const [err, ret] = await this.query(query)
        let bet = inparam.betCount
        let win = inparam.winCount
        console.log(bet)
        console.log(win)
        if (ret.Items && ret.Items.length > 0) {
            const record = ret.Items[0]
            bet += record.bet
            win += record.win
        }
        console.log('执行插入')
        this.putItem({
            ...this.item,
            userId: inparam.userId,
            balance: inparam.balance,
            bet: bet,
            win: win
        }).then((res) => {
            console.log('12334353')
            console.log(res)
        }).catch((err) => {
            console.error(err)
        })
        console.log('打印结束')
    }
}
