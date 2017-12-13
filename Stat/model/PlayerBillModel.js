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
    async calcPlayerStat(inparam) {
        let promiseArr = []
        let self = this
        for (let gameUserName of inparam.gameUserNames) {
            let p = new Promise(async function (resolve, reject) {
                // 查询玩家账单并计算
                let playerInparam = { userName: gameUserName, gameType: inparam.gameType, createdAt: inparam.query.createdAt }
                let playerPromise = self.calcPlayerFlow(playerInparam)
                playerPromise.then(async (res) => {
                    let createdAt = [res.createdAt, inparam.query.createdAt[1]]
                    let res2 = await self.calcPlayerFlowDetail({ userName: gameUserName, gameType: inparam.gameType, createdAt: createdAt })
                    let bet = res.bet + res2.bet
                    let winlose = res.winlose + res2.winlose
                    let betCount = res.betCount + res2.betCount
                    let mixAmount = res.mixAmount + res2.mixAmount
                    // let winloseRate = bet == 0 ? 0 : +(winlose / bet).toFixed(4)
                    console.log('玩家name:' + gameUserName + '玩家bet:' + bet + '玩家winlose:' + winlose + '次数:' + betCount)
                    // 返回数据
                    let finalResult = {
                        gameUserName: gameUserName,
                        bet: Math.abs(+bet.toFixed(2)),
                        winlose: +winlose.toFixed(2),
                        betCount: betCount,
                        mixAmount: mixAmount,
                        // winloseRate: winloseRate,
                        mix: res.mix,
                        rate: res.rate
                    }
                    console.log('玩家name:' + gameUserName + '执行成功:' + new Date().getTime())
                    console.log('总汇总：' + JSON.stringify(finalResult))
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
        let filterRes = []
        for (let item of finalRes) {
            if (item.betCount > 0) {
                filterRes.push(item)
            }
        }
        return [false, filterRes]
    }

    /**
     * 计算玩家流水
     * @param {*} inparam 
     */
    calcPlayerFlow(inparam) {
        let self = this
        return new Promise(function (resolve, reject) {
            console.log(inparam.userName + '查询汇总流水表开始：' + new Date().getTime())
            let query = {
                ProjectionExpression: 'amount,betAmount,reAmount,busCount,mixAmount,#mix,#rate,#createAt',
                KeyConditionExpression: '#userName  = :userName AND createAt between :createdAt0 AND :createdAt1',
                FilterExpression: "gameType=:gameType",
                ExpressionAttributeNames: {
                    '#userName': 'userName',
                    '#mix': 'mix',
                    '#rate': 'rate',
                    '#createAt': 'createAt'
                },
                ExpressionAttributeValues: {
                    ':userName': inparam.userName,
                    ':gameType': parseInt(inparam.gameType),
                    ':createdAt0': parseInt(inparam.createdAt[0]),
                    ':createdAt1': parseInt(inparam.createdAt[1]),
                }
            }
            self.query(query).then((resArr) => {
                let res = resArr[1]
                console.log('汇总查询结束：' + new Date().getTime() + '查询流水个数' + res.Items.length)
                let bet = 0                 // 下注
                let winlose = 0             // 输赢
                let betCount = 0            // 次数
                let mixAmount = 0           // 洗码率量
                let mix = 0                 // 洗码比
                let rate = 0                // 抽成比
                // let commission = 0          // 佣金
                // let agentTotalAmount = 0    // 代理总金额
                // let agentSubmit = 0         // 代理交公司
                // let profitRate = 0          // 获利比例
                let createdAt = parseInt(inparam.createdAt[0])
                for (let item of res.Items) {
                    bet += Math.abs(parseFloat(item.betAmount || 0))
                    winlose += parseFloat(item.amount || 0)
                    betCount += parseInt(item.busCount || 0)
                    mixAmount += Math.abs(parseFloat(item.mixAmount || item.betAmount || 0))
                    if (item.createAt > createdAt) {//取出最大的记录时间
                        createdAt = item.createAt
                    }
                    // mix = item.mix
                    // rate = item.rate
                }
                console.log('最后一次汇总时间：' + createdAt)
                let totalObj = { bet: bet, winlose: winlose, betCount: betCount, mixAmount: mixAmount, mix: mix, rate: rate, createdAt: createdAt }
                console.log('查询汇总流水结果:' + JSON.stringify(totalObj))
                resolve(totalObj)
            }).catch((err) => {
                reject(err)
            })
        })
    }
    /**
    * 从流水表计算玩家流水 playerBillDetail
    * @param {*} inparam 
    */
    async calcPlayerFlowDetail(inparam) {
        let self = this
        return new Promise(function (resolve, reject) {
            console.log(inparam.userName + '查询流水表开始：' + new Date().getTime())
            let query = {
                TableName: 'PlayerBillDetail',
                IndexName: 'UserNameIndex',
                ProjectionExpression: 'amount,#mix,#rate,#type',
                KeyConditionExpression: '#userName  = :userName AND createdAt between :createdAt0 AND :createdAt1',
                FilterExpression: " #gameType=:gameType",
                ExpressionAttributeNames: {
                    '#userName': 'userName',
                    '#mix': 'mix',
                    '#rate': 'rate',
                    '#gameType': 'gameType',
                    '#type': 'type'

                },
                ExpressionAttributeValues: {
                    ':userName': inparam.userName,
                    ':createdAt0': parseInt(inparam.createdAt[0]),
                    ':createdAt1': parseInt(inparam.createdAt[1]),
                    ':gameType': inparam.gameType
                }
            }
            self.query(query).then((resArr) => {
                let res = resArr[1]
                console.log('查询结束：' + new Date().getTime() + '查询流水个数' + res.Items.length)
                let bet = 0                 // 下注
                let winlose = 0             // 输赢
                let betCount = 0            // 次数
                let mixAmount = 0           // 洗码率量
                let mix = 0                 // 洗码比
                let rate = 0                // 抽成比
                let mixtype5 = 0            //
                // let commission = 0          // 佣金
                // let agentTotalAmount = 0    // 代理总金额
                // let agentSubmit = 0         // 代理交公司
                // let profitRate = 0          // 获利比例
                for (let item of res.Items) {
                    if (item.type == 3) {
                        bet += Math.abs(parseFloat(item.amount || 0))
                        betCount++
                    } else if (item.type == 4) {
                        winlose += parseFloat(item.amount || 0)
                    } else if (item.type == 5) {
                        mixtype5 += parseFloat(item.amount || 0)
                    }

                    // mix = item.mix
                    // rate = item.rate
                }
                mixAmount = bet - mixtype5
                let totalObj = { bet: bet, winlose: winlose, betCount: betCount, mixAmount: mixAmount, mix: mix, rate: rate }
                console.log('流水表详情汇总:' + JSON.stringify(totalObj))
                resolve(totalObj)
            }).catch((err) => {
                reject(err)
            })
        })
    }
}