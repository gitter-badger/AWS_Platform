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
            KeyConditionExpression: '#userName = :userName',
            ExpressionAttributeNames: {
                '#userName': 'userName'
            },
            ExpressionAttributeValues: {
                ':userName': inparam.userName
            }
        }
        const [err, ret] = await this.query(query)
        let bet = inparam.betCount
        let win = inparam.winCount
        if (ret.Items && ret.Items.length > 0) {
            const record = ret.Items[0]
            bet += parseFloat(record.bet) 
            win += parseFloat(record.win)
        }
        this.putItem({
            ...this.item,
            userName: inparam.userName,
            userId: inparam.userId,
            balance: inparam.balance.toFixed(2),
            bet: bet.toFixed(2),
            win: win.toFixed(2)
        }).then((res) => {
            console.log(res)
        }).catch((err) => {
            console.error(err)
        })
    }
}
