const DefaultMixRateEnum = require('../lib/Consts')
const BaseModel = require('./BaseModel')
const PlayerBillDetailModel = require('./PlayerBillDetailModel')
const UserModel = require('./UserModel')

/**
 * 实际业务子类，继承于BaseModel基类
 */
module.exports = class PlayerModel extends BaseModel {
    constructor() {
        super()
        // 设置表名
        this.params = {
            TableName: 'HeraGamePlayer'
        }
        // 设置对象属性
        this.item = {
            ...this.baseitem,
            sn: 'NULL!'
        }
    }

    /**
     * 获取玩家游戏相关信息
     * @param {*} userName 
     */
    async getPlayer(userName) {
        const res = await this.getItem({
            ProjectionExpression: 'userId,userName,sessionId,balanceCache,liveMix,vedioMix,rate,balance',
            Key: {
                'userName': userName
            }
        })
        return res.Item
    }

    /**
     * 更新玩家洗码比和抽成比
     * @param {*} player 
     */
    async updateMixAndRate(player) {
        // 查询玩家所属
        new UserModel().queryUserById(player.parent).then((res) => {
            let liveMix = DefaultMixRateEnum.liveMix
            let vedioMix = DefaultMixRateEnum.vedioMix
            let rate = DefaultMixRateEnum.rate
            if (res.Items.length == 1) {
                liveMix = res.Items[0].liveMix || liveMix
                vedioMix = res.Items[0].vedioMix || vedioMix
                rate = res.Items[0].rate || rate
            }
            // 更新玩家所属的洗码比和抽成比
            this.updateItem({
                Key: {
                    'userName': player.userName
                },
                UpdateExpression: "SET liveMix = :liveMix,vedioMix=:vedioMix,rate = :rate",
                ExpressionAttributeValues: {
                    ':liveMix': liveMix,
                    ':vedioMix': vedioMix,
                    ':rate': rate
                }
            }).then((res) => {
                console.info(`玩家${player.userName}的洗码比和抽成比更新完成，liveMix:${liveMix};vedioMix:${vedioMix};rate:${rate}`)
            }).catch((err) => {
                console.error(err)
            })
        }).catch((err) => {
            console.error(err)
        })
    }

    /**
     * 更新玩家实时流水和余额相关
     * @param {*} player 
     * @param {*} data 
     * @param {*} amtAfter 
     */
    async updateBalanceCache(player, data, amtAfter) {
        // 写入流水
        const p1 = new PlayerBillDetailModel().putItem({
            sn: 'ATTG' + this.billSerial(player.userId),
            billId: player.sessionId,
            userId: player.userId,
            userName: player.userName,
            amount: parseFloat(data.amt),
            originalAmount: player.balanceCache,
            balance: amtAfter,
            action: parseFloat(data.amt) < 0 ? -1 : 1,
            mix: player.vedioMix,   // 暂时使用电子游戏洗码比
            rate: player.rate,
            type: (data.txnsubtypeid == '400' || data.txnsubtypeid == '450') ? 3 : 4
        })
        // 更新实时余额
        const p2 = this.updateItem({
            Key: {
                'userName': userName
            },
            UpdateExpression: "SET balanceCache = :balanceCache",
            ExpressionAttributeValues: {
                ':balanceCache': amtAfter
            }
        })
        // 并发操作
        await Promise.all([p1, p2])
    }
}

