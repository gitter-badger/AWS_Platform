const BaseModel = require('./BaseModel')
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
            ProjectionExpression: 'sessionId,balance,balanceCache',
            Key: {
                "userName": userName
            }
        })
        return res.Item
    }
}
