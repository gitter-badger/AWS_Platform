import { Tables, Store$, Codes, BizErr, Model, RoleCodeEnum, RoleModels } from '../lib/all'
import { BaseModel } from './BaseModel'
import _ from 'lodash'

export class PlayerBillModel extends BaseModel {
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
     * 计算用户流水
     * @param {*} inparam 
     */
    async calcPlayerBill(inparam) {
        let promiseArr = []
        let self = this
        for (let gameUserId of inparam.gameUserIds) {
            let p = new Promise(function (resolve, reject) {
                // 查询玩家账单并计算
                let playerInparam = { gameUserId: gameUserId, gameType: inparam.gameType, createdAt: inparam.query.createdAt }
                let playerPromise = self.calcPlayerFlow(playerInparam)
                playerPromise.then((res) => {
                    let bet = res.bet
                    let winlose = res.winlose
                    let betCount = res.betCount
                    let winloseRate = bet == 0 ? 0 : +(winlose / bet).toFixed(2)
                    console.log('玩家id:' + gameUserId + '玩家bet:' + bet + '玩家winlose:' + winlose + '次数:' + betCount + '比例:' + winloseRate)
                    // 返回数据
                    let finalResult = {
                        gameUserId: gameUserId,
                        bet: Math.abs(+bet.toFixed(2)),
                        winlose: +winlose.toFixed(2),
                        betCount: betCount,
                        winloseRate: winloseRate,
                    }
                    console.log('玩家id:' + gameUserId + '执行成功:' + new Date().getTime())
                    resolve(finalResult)
                }).catch((err) => {
                    console.error(err)
                })
            })
            promiseArr.push(p)
        }
        // 并发所有玩家流水汇总查询
        let finalRes = []
        let start = new Date().getTime()
        if (promiseArr.length > 0) {
            finalRes = await Promise.all(promiseArr)
        }
        let end = new Date().getTime()
        console.log('所有并发执行耗时：' + (end - start) + '毫秒')
        console.log(finalRes)
        return [false, finalRes]
    }

    /**
     * 计算玩家流水
     * @param {*} inparam 
     */
    calcPlayerFlow(inparam) {
        let self = this
        return new Promise(function (resolve, reject) {
            console.log(inparam.gameUserId + '查询流水开始：' + new Date().getTime())
            let query = {
                IndexName: 'userIdIndex',
                ProjectionExpression: 'amount,betAmount,reAmount,busCount',
                KeyConditionExpression: '#userId  = :userId AND createAt between :createdAt0 AND :createdAt1',
                FilterExpression: "gameType=:gameType",
                ExpressionAttributeNames: {
                    '#userId': 'userId',
                },
                ExpressionAttributeValues: {
                    ':userId': parseInt(inparam.gameUserId),
                    ':gameType': parseInt(inparam.gameType),
                    ':createdAt0': parseInt(inparam.createdAt[0]),
                    ':createdAt1': parseInt(inparam.createdAt[1]),
                }
            }
            self.query(query).then((resArr) => {
                let res = resArr[1]
                console.log('查询结束：' + new Date().getTime() + '查询流水个数' + res.Items.length)
                let bet = 0         // 下注
                let winlose = 0     // 输赢
                let betCount = 0    // 次数
                for (let item of res.Items) {
                    bet += parseFloat(item.betAmount || 0)
                    winlose += parseFloat(item.amount || 0)
                    betCount += parseInt(item.busCount || 0)
                }
                resolve({ bet: bet, winlose: winlose, betCount: betCount })
            }).catch((err) => {
                reject(err)
            })
        })
    }
}
