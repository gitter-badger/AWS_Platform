import { Tables, Store$, Codes, BizErr, Model, RoleCodeEnum, RoleModels } from '../lib/all'
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
        // 判断是否重复
        const [existErr, exist] = await this.isExist({
            KeyConditionExpression: 'companyName = :companyName',
            ExpressionAttributeValues: {
                ':companyName': companyInfo.companyName
            }
        })
        if (exist) {
            return [BizErr.ItemExistErr('运营商已存在'), 0]
        }
        const dataItem = {
            ...this.item,
            ...companyInfo
        }
        // 保存
        const [putErr, putRet] = await this.putItem(dataItem)
        return [0, dataItem]
    }

    /**
     * 厂商列表
     * @param {*} inparams
     */
    async listCompany(inparams) {
        const [err, ret] = await this.scan({
        })
        return [0, ret]
    }

    /**
     * 更新厂商状态
     * @param {厂商名称} companyName 
     * @param {厂商ID} companyId 
     * @param {需要变更的状态} status 
     */
    async changeStatus(companyName, companyId, status) {
        const [err, ret] = await this.updateItem({
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
     * @param {*} inparam
     */
    async getOne(inparam) {
        const [err, ret] = await this.query({
            KeyConditionExpression: 'companyName = :companyName and companyId = :companyId',
            ExpressionAttributeValues: {
                ':companyName': inparam.companyName,
                ':companyId': inparam.companyId
            }
        })
        if (ret.Items.length > 0) {
            return [0, ret.Items[0]]
        } else {
            return [0, 0]
        }
    }

    /**
     * 更新
     * @param {*} inparam 
     */
    async update(inparam) {
        // 更新
        const [err, ret] = await this.getOne(inparam)
        if (!ret) {
            return [new BizErr.ItemNotExistErr(), 0]
        }
        ret.companyContact = inparam.companyContact
        ret.companyContactWay = inparam.companyContactWay
        ret.companyContract = inparam.companyContract
        ret.companyDesc = inparam.companyDesc
        ret.companyEmail = inparam.companyEmail
        ret.companyRegion = inparam.companyRegion
        ret.license = inparam.license
        ret.updatedAt = Model.timeStamp()
        const [putErr, putRet] = await this.putItem(ret)
        return [0, ret]
    }
}


