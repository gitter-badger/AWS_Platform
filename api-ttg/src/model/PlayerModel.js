const BaseModel = require('./BaseModel')
const PlayerBillDetailModel = require('./PlayerBillDetailModel')
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
            ProjectionExpression: 'userId,userName,sessionId,balanceCache,balance',
            Key: {
                'userName': userName
            }
        })
        return res.Item
    }

    /**
     * 更新玩家实时流水和余额相关
     * @param {*} player 
     * @param {*} data 
     * @param {*} amtAfter 
     */
    async updateBalanceCache(player, data, amtAfter) {
        // 写入流水
        await new PlayerBillDetailModel().putItem({
            sn: this.billSerial(player.userId),
            billId: player.sessionId,
            userId: player.userId,
            userName: player.userName,
            amount: parseFloat(data.amt),
            originalAmount: player.balanceCache,
            balance: amtAfter,
            action: parseFloat(data.amt) < 0 ? -1 : 1,
            mix: '洗码比',
            rate: '抽成比',
            type: (data.txnsubtypeid == '400' || data.txnsubtypeid == '450') ? 3 : 4
        })
        // 更新实时余额
        await this.updateItem({
            Key: {
                'userName': userName
            },
            UpdateExpression: "SET balanceCache = :balanceCache",
            ExpressionAttributeValues: {
                ':balanceCache': amtAfter
            }
        })
    }
}

