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
     * 插入数据
     */
    async insertRank(inparam) {
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
        if (ret.Items.length == 0) {
            let bet = parseFloat(inparam.betCount)
            let win = parseFloat(inparam.winCount)
            this.putItem({
                ...this.item,
                userName: inparam.userName,
                nickname: inparam.nickname,
                headPic: inparam.headPic,
                userId: inparam.userId,
                bet: +bet.toFixed(2),
                win: +win.toFixed(2)
            }).then((res) => {
                console.log(res)
                console.log('新用户下注和返奖统计插入完成')
            }).catch((err) => {
                console.error(err)
            })
        } else {
            this.updateRank(inparam)
        }
    }

    /**
     * 更新数据
     */
    async updateRank(inparam) {
        let bet = parseFloat(inparam.betCount)
        let win = parseFloat(inparam.winCount)
        let updateObj = {
            Key: { userName: inparam.userName },
            UpdateExpression: 'SET bet=bet + :bet,win=win + :win,nickname=:nickname,headPic=:headPic',
            ExpressionAttributeValues: {
                ':bet': inparam.bet,
                ':win': inparam.win,
                ':nickname': inparam.nickname,
                ':headPic': inparam.headPic
            }
        }

        this.updateItem(updateObj).then((res) => {
            console.log(res)
            console.log('用户下注和返奖统计更新完成')
        }).catch((err) => {
            console.error(err)
        })
    }
}
