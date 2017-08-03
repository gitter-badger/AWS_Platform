import {
    Tables,
    Store$,
    Codes,
    BizErr,
    Trim,
    Empty,
    Model,
    Keys,
    Pick,
    Omit,
    RoleCodeEnum,
    RoleModels,
    CompanyStatusEnum
} from '../lib/all'
import _ from 'lodash'
import { BaseModel } from './BaseModel'

export class CompanyModel extends BaseModel {
    constructor() {
        super()
        // 设置表名
        this.params = {
            TableName: Tables.DianaPlatformCompany,
        }
        // 设置对象属性
        this.item = {
            ...this.baseitem,
            companyName: Model.StringValue,
            companyId: Model.uuid(),
            companyKey: Model.uuid()
        }
    }

    /**
     * 添加厂商
     * @param {*} companyInfo 
     */
    async addCompany(companyInfo) {
        // 数据类型处理
        companyInfo.companyStatus = CompanyStatusEnum.Enable
        companyInfo.companyDesc = companyInfo.companyDesc || Model.StringValue
        companyInfo.companyContract = companyInfo.companyContract || Model.StringValue
        companyInfo.license = companyInfo.license || Model.StringValue
        companyInfo.remark = companyInfo.remark || Model.StringValue
        // 判断是否重复
        const [existErr, exist] = await this.isExist({
            KeyConditionExpression: 'companyName = :companyName',
            ExpressionAttributeValues: {
                ':companyName': companyInfo.companyName
            }
        })
        if (existErr) {
            return [existErr, 0]
        }
        if (exist) {
            return [BizErr.ItemExistErr('运营商已存在'), 0]
        }
        const dataItem = {
            ...this.item,
            ...companyInfo
        }
        // 保存
        const [putErr, putRet] = await this.putItem(dataItem)
        if (putErr) {
            return [putErr, 0]
        }
        return [0, dataItem]
    }

    /**
     * 厂商列表
     * @param {*} inparams
     */
    async listCompany(inparams) {
        const [err, ret] = await this.scan({
        })
        if (err) {
            return [err, 0]
        }
        return [0, ret]
    }

    /**
     * 更新厂商状态
     * @param {厂商名称} companyName 
     * @param {厂商ID} companyId 
     * @param {需要变更的状态} status 
     */
    async changeStatus(companyName, companyId, status) {
        const [err, ret] = this.updateItem({
            Key: {
                'companyName': companyName,
                'companyId': companyId
            },
            UpdateExpression: "SET companyStatus = :status",
            ExpressionAttributeValues: {
                ':status': status
            }
        })
        return [err, ret]
    }

    /**
     * 查询单个厂商
     * @param {*} companyName
     * @param {*} companyId
     */
    async getOne(companyName, companyId) {
        const [err, ret] = await this.query({
            KeyConditionExpression: 'companyName = :companyName and companyId = :companyId',
            ExpressionAttributeValues: {
                ':companyName': companyName,
                ':companyId': companyId
            }
        })
        if (err) {
            return [err, 0]
        }
        if (ret.Items.length > 0) {
            return [0, ret.Items[0]]
        } else {
            return [0, 0]
        }
    }
}


