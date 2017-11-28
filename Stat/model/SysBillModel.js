import { Tables, Store$, Codes, BizErr, Model, RoleCodeEnum, RoleModels } from '../lib/all'
import _ from 'lodash'
import { BaseModel } from './BaseModel'
import { PlayerBillModel } from './PlayerBillModel'


export class SysBillModel extends BaseModel {
    constructor() {
        super()
        // 设置表名
        this.params = {
            TableName: Tables.ZeusPlatformUser,
        }
        // 设置对象属性
        this.item = {
            ...this.baseitem
        }
    }
    /**
     * 查询指定条件下商户的统计信息
     * @param {*} inparam
     */
    async calcMerchantStat(inparam) {
        let promiseArr = []
        let self = this
        for (let userId of inparam.userIds) {
            let p = new Promise(async function (resolve, reject) {
                let query = {
                    TableName: Tables.HeraGamePlayer,
                    IndexName: 'parentIdIndex',
                    ProjectionExpression: 'userId',
                    KeyConditionExpression: '#parent = :parent',
                    ExpressionAttributeNames: {
                        '#parent': 'parent'
                    },
                    ExpressionAttributeValues: {
                        ':parent': userId
                    }
                }
                const [playersErr, playersRet] = await self.query(query)
                console.log('商户：' + userId + '的玩家个数有：' + playersRet.Items.length)
                let gameUserIdsArr = []
                for (let player of playersRet.Items) {
                    gameUserIdsArr.push(player.userId)
                }
                // 查询所有商户对应玩家的流水
                const [playerWaterErr, playerWaterRet] = await new PlayerBillModel().calcPlayerBill({ gameUserIds: gameUserIdsArr, gameType: inparam.gameType, query: { createdAt: inparam.query.createdAt } })
                let bet = 0
                let betCount = 0
                let winlose = 0
                for (let playerWater of playerWaterRet) {
                    bet += playerWater.bet
                    betCount += playerWater.betCount
                    winlose += playerWater.winlose
                }
                let winloseRate = bet == 0 ? 0 : +(winlose / bet).toFixed(2)
                console.log('商户userid：' + userId + 'bet:' + bet + 'winlose:' + winlose + 'betCount:' + betCount + 'winloseRate:' + winloseRate)
                resolve({ userId: userId, bet: bet, betCount: betCount, winlose: winlose, winloseRate: winloseRate })
            })
            promiseArr.push(p)
        }
        // 并发所有查询
        let finalRes = []
        if (promiseArr.length > 0) {
            finalRes = await Promise.all(promiseArr)
        }
        return [false, finalRes]
    }
    /**
     * 查询指定条件下线路商的统计信息
     * @param {*} inparam 
     */
    async calcManagerStat(inparam) {
        let promiseArr = []
        let self = this
        for (let userId of inparam.userIds) {
            let p = new Promise(async function (resolve, reject) {
                let query = {
                    FilterExpression: 'contains(#levelIndex,:levelIndex)',
                    ProjectionExpression: 'userId',
                    ExpressionAttributeNames: {
                        '#levelIndex': 'levelIndex'
                    },
                    ExpressionAttributeValues: {
                        ':levelIndex': userId
                    }
                }
                const [merchantsErr, merchantsRet] = await self.scan(query)
                if (merchantsErr) return [merchantsErr, 0]
                console.log('线路商所有下级商户的个数：' + merchantsRet.Items.length)
                let userIdsArr = []
                for (let merchant of merchantsRet.Items) {
                    userIdsArr.push(merchant.userId)
                }
                // 查询所有商户对应玩家的流水
                const [playerWaterErr, playerWaterRet] = await self.calcMerchantStat({ userIds: userIdsArr, gameType: inparam.gameType, query: { createdAt: inparam.query.createdAt } })
                let bet = 0
                let betCount = 0
                let winlose = 0
                for (let playerWater of playerWaterRet) {
                    bet += playerWater.bet
                    betCount += playerWater.betCount
                    winlose += playerWater.winlose
                }
                let winloseRate = bet == 0 ? 0 : +(winlose / bet).toFixed(2)
                console.log('线路商userid：' + userId + 'bet：' + bet + 'betCount:' + betCount + 'winlose:' + winlose + 'winloseRate:' + winloseRate)
                resolve({ userId: userId, bet: bet, betCount: betCount, winlose: winlose, winloseRate: winloseRate })
            })
            promiseArr.push(p)
        }
        // 并发所有查询
        let finalRes = []
        if (promiseArr.length > 0) {
            finalRes = await Promise.all(promiseArr)
        }
        return [false, finalRes]
    }
    /**
     * 查询指定条件下平台管理员的统计信息
     * @param {*} inparam 
     */
    async calcAdminStat(inparam) {
        let query = {
            ProjectionExpression: 'userId',
            KeyConditionExpression: '#role = :role',
            ExpressionAttributeNames: {
                '#role': 'role'
            },
            ExpressionAttributeValues: {
                ':role': RoleCodeEnum.Merchant
            }
        }
        const [merchantsErr, merchantsRet] = await this.query(query)
        if (merchantsErr) return [merchantsErr, 0]
        console.log('平台所有下级商户的个数：' + merchantsRet.Items.length)
        let userIdsArr = []
        for (let merchant of merchantsRet.Items) {
            userIdsArr.push(merchant.userId)
        }
        // 查询所有商户对应玩家的流水
        const [playerWaterErr, playerWaterRet] = await this.calcMerchantStat({ userIds: userIdsArr, gameType: inparam.gameType, query: { createdAt: inparam.query.createdAt } })
        let bet = 0
        let betCount = 0
        let winlose = 0
        for (let playerWater of playerWaterRet) {
            bet += playerWater.bet
            betCount += playerWater.betCount
            winlose += playerWater.winlose
        }
        let winloseRate = bet == 0 ? 0 : +(winlose / bet).toFixed(2)
        console.log('平台管理员：' + inparam.userIds[0] + 'bet：' + bet + 'betCount:' + betCount + 'winlose:' + winlose + 'winloseRate:' + winloseRate)
        return [0, [{ userId: inparam.userIds[0], bet: bet, betCount: betCount, winlose: winlose, winloseRate: winloseRate }]]
    }
    /**
     * 查询指定条件下代理的统计信息
     * @param {*} inparam 
     */
    async calcAgentStat(inparam) {
        let promiseArr = []
        let self = this
        for (let userId of inparam.userIds) {
            let p = new Promise(async function (resolve, reject) {
                let query = {
                    FilterExpression: 'contains(#levelIndex,:levelIndex)',
                    ProjectionExpression: 'userId',
                    ExpressionAttributeNames: {
                        '#levelIndex': 'levelIndex'
                    },
                    ExpressionAttributeValues: {
                        ':levelIndex': userId
                    }
                }
                const [agentsErr, agentsRet] = await self.scan(query)
                if (agentsErr) return [agentsErr, 0]
                console.log('所有下级代理的个数：' + agentsRet.Items.length)
                let userIdsArr = []
                for (let agent of agentsRet.Items) {
                    userIdsArr.push(agent.userId)
                }
                userIdsArr.push(userId)
                // 查询所有代理对应玩家的流水
                const [playerWaterErr, playerWaterRet] = await self.calcMerchantStat({ userIds: userIdsArr, gameType: inparam.gameType, query: { createdAt: inparam.query.createdAt } })
                let bet = 0
                let betCount = 0
                let winlose = 0
                for (let playerWater of playerWaterRet) {
                    bet += playerWater.bet
                    betCount += playerWater.betCount
                    winlose += playerWater.winlose
                }
                let winloseRate = bet == 0 ? 0 : +(winlose / bet).toFixed(2)
                console.log('代理userid：' + userId + '参数：bet：' + bet + 'betCount:' + betCount + 'winlose:' + winlose + 'winloseRate:' + winloseRate)
                resolve({ userId: userId, bet: bet, betCount: betCount, winlose: winlose, winloseRate: winloseRate })
            })
            promiseArr.push(p)
        }
        // 并发所有查询
        let finalRes = []
        if (promiseArr.length > 0) {
            finalRes = await Promise.all(promiseArr)
        }
        return [false, finalRes]
    }
    /**
     * 查询指定条件下代理管理员的统计信息
     * @param {*} inparam 
     */
    async calcAgentAdminStat(inparam) {
        let query = {
            ProjectionExpression: 'userId',
            KeyConditionExpression: '#role = :role',
            ExpressionAttributeNames: {
                '#role': 'role'
            },
            ExpressionAttributeValues: {
                ':role': RoleCodeEnum.Agent
            }
        }
        const [agentsErr, agentsRet] = await this.query(query)
        if (agentsErr) return [agentsErr, 0]
        console.log('所有下级代理的个数：' + agentsRet.Items.length)
        let userIdsArr = []
        for (let agent of agentsRet.Items) {
            userIdsArr.push(agent.userId)
        }
        // 查询所有代理对应玩家的流水
        const [playerWaterErr, playerWaterRet] = await this.calcMerchantStat({ userIds: userIdsArr, gameType: inparam.gameType, query: { createdAt: inparam.query.createdAt } })
        let bet = 0
        let betCount = 0
        let winlose = 0
        for (let playerWater of playerWaterRet) {
            bet += playerWater.bet
            betCount += playerWater.betCount
            winlose += playerWater.winlose
        }
        let winloseRate = bet == 0 ? 0 : +(winlose / bet).toFixed(2)
        console.log('代理userid：' + inparam.userIds[0] + 'bet：' + bet + 'betCount:' + betCount + 'winlose:' + winlose + 'winloseRate:' + winloseRate)
        return [0, [{ userId: inparam.userIds[0], bet: bet, betCount: betCount, winlose: winlose, winloseRate: winloseRate }]]
    }
}
