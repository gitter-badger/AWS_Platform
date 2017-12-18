const BaseModel = require('./BaseModel')
const _ = require('lodash')
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
        const res = await this.getItem({
            ProjectionExpression: 'balance',
            Key: {
                "userName": userName
            }
        })
        if (_.isEmpty(res)) {
            return -1
        } else {
            return res.Item.balance
        }
    }
}
