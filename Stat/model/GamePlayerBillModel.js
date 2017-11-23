import { Tables, Store$, Codes, BizErr, Trim, Empty, Model, Keys, Pick, Omit, RoleCodeEnum, RoleModels } from '../lib/all'
import { BaseModel } from './BaseModel'
import _ from 'lodash'

export class GamePlayerBillModel extends BaseModel {
    constructor() {
        super()
        // 设置表名
        this.params = {
            TableName: Tables.HeraGamePlayerBill,
        }
        // 设置对象属性
        this.item = {
            ...this.baseitem
        }
    }
    /**
     * 查询用户并统计
     */

    async scanPlayerBill(inparam) {
        let self=this
        return new Promise(function (resolve, reject) {
            let query = {
                KeyConditionExpression: "userName=:userName",
                ProjectionExpression: "betAmount,reAmount",
                ExpressionAttributeValues: {
                    ":userName": inparam.userName
                }
            }
            self.query(query).then((res) => {
                let resArr=res[1]
                console.log('用户名：' + inparam.userName + '一共有：' + resArr.Items.length + '条记录')
                let bet = 0
                let win = 0
                for (let playerBill of resArr.Items) {
                    bet += playerBill.betAmount || 0
                    win += playerBill.reAmount  || 0
                }
                let updateObj = {
                    TableName: Tables.UserRankStat,
                    Key: { userName: inparam.userName },
                    UpdateExpression: 'SET bet = :bet,win=:win',
                    ExpressionAttributeValues: {
                        ':bet': Math.abs(+bet.toFixed(2)),
                        ':win': +win.toFixed(2)
                    }
                }
                console.log('用户名：' + inparam.userName + '本次插入数据为bet：' + bet + ';win:' + win)
                self.updateItem(updateObj).then((res) => {
                    console.log(res)
                    resolve(res)
                }).catch((err) => {
                    console.log(err)
                    reject(err)
                })
            }).catch((err) => {
                console.log(err)
                reject(err)
            })

        })

    }
}
