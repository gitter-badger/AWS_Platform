import { Tables, Store$, Codes, BizErr, Empty, Model, Keys, Pick, Omit, StatusEnum, RoleCodeEnum, RoleModels, MysteryStatusEnum } from '../lib/all'
import _ from 'lodash'
import { BaseModel } from './BaseModel'
export class MysteryModel extends BaseModel {
    constructor() {
        super()
        // 设置表名
        this.params = {
            TableName: Tables.SYSMystery,
        }
        // 设置对象属性
        this.item = {
            ...this.baseitem,
            sn: Model.StringValue,
            winAt: Model.NumberValue
        }
    }

    /**
     * 添加神秘大奖记录
     * @param {*} inparam 
     */
    async add(inparam) {
        const [err, ret] = await this.putItem(inparam)
        if (err) {
            return [err, 0]
        }
        return [0, ret]
    }

    /**
     * 查询神秘大奖列表
     * @param {*} inparam 
     */
    async page(inparam) {
        let query = {}
        // 条件搜索
        if (!_.isEmpty(inparam.query)) {
            if (inparam.query.winAt) {
                inparam.query.winAt = { $range: inparam.query.winAt }
            }
            if (inparam.query.userName) { inparam.query.userName = { $like: inparam.query.userName } }
            if (inparam.query.merchantName) { inparam.query.merchantName = { $like: inparam.query.merchantName } }
            if (inparam.query.msn) { inparam.query.msn = inparam.query.msn }
            if (inparam.query.nickname) { inparam.query.nickname = { $like: inparam.query.nickname } }
            const queryParams = this.buildQueryParams(inparam.query, false)
            query.FilterExpression = queryParams.FilterExpression
            query.ExpressionAttributeNames = { ...query.ExpressionAttributeNames, ...queryParams.ExpressionAttributeNames }
            query.ExpressionAttributeValues = { ...query.ExpressionAttributeValues, ...queryParams.ExpressionAttributeValues }
        }
        console.info(query)
        const [queryErr, adminRet] = await this.scan(query)
        if (queryErr) {
            return [queryErr, 0]
        }
        // 排序输出
        let sortResult = _.sortBy(adminRet.Items, [inparam.sortkey || 'winAt'])
        if (inparam.sort == "desc") { sortResult = sortResult.reverse() }
        return [0, sortResult]
    }
    /**
     * 更新神秘大奖状态
     * @param {*} inparam 
     */
    async updateOperate(inparam) {
        let receiveAt = 0
        if (inparam.status == MysteryStatusEnum.Received) {
            let receiveAt = new Date().getTime()
        }
        let updateObj = {
            Key: { 'sn': inparam.sn, 'winAt': parseInt(inparam.winAt) },
            UpdateExpression: 'SET #status = :status,receiveAt = :receiveAt',
            ExpressionAttributeNames: {
                '#status': 'status'
            },
            ExpressionAttributeValues: {
                ':status': inparam.status,
                ':receiveAt': receiveAt
            }
        }
        const [err, ret] = await this.updateItem(updateObj)
        if (err) {
            return [err, 0]
        }
        return [0, ret]
    }

}
