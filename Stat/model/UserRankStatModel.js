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
     * 查询用户排行
     */

    async scanRank(inparam) {
        const [err, ret] = await this.scan({
        })
        if (err) {
            return [err, 0]
        }
        const sortResult = _.sortBy(ret.Items, [inparam.sortkey])
        const descResult = sortResult.reverse()
        for (let i = 1; i <= descResult.length; i++) {
            descResult[i - 1] = { ...descResult[i - 1], index: i }
        }
        // 用户ID存在时，查询其前后用户
        if (inparam.userName != '0') {
            let targetUserIndex = _.findIndex(descResult, function (i) { return i.userName == inparam.userName })
            let start = targetUserIndex < 2 ? 0 : targetUserIndex - 2
            let end = start + 5 > descResult.length - 1 ? descResult.length : targetUserIndex + 3
            let data = _.slice(descResult, start, end)
            return [0, data]
        }
        return [0, descResult.slice(0, 200)]
    }
    /**
     * 批量插入用户余额排行榜
     */
    async putsRank(inparam) {
        this.putItem({
            userName: inparam.userName,
            userId: inparam.userId,
            balance: inparam.balance,
            bet: 0,
            win: 0
        }).then((res) => {
        }).catch((err) => {
            console.error(err)
        })
        return [0, 1]
    }

    /**
     * 批量更新用户流水排行榜
     * @param {*} inparam 
     */
    async updateBetRank(inparam) {
        this.updateItem({
            Key: { 'userName': inparam.userName },
            UpdateExpression: 'SET bet = :bet , win = :win',
            ExpressionAttributeValues: {
                ':bet': parseFloat(inparam.bet),
                ':win': parseFloat(inparam.win)
            }
        }).then((res) => {
        }).catch((err) => {
            console.error(err)
        })
        return [0, 1]
    }
}
