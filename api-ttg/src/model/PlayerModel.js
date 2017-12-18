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
     * 获取玩家余额
     * @param {*} userName 
     */
    async getPlayerBalance(userName) {
        const player = await this.getItem({
            ProjectionExpression: 'balance',
            Key: {
                "userName": userName
            }
        })
        console.info('1111')
        console.info(player)
        console.info('2222')
        return player.balance
    }
}
