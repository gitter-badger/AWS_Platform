import {
    Tables,
    Store$,
    Codes,
    BizErr,
    RoleCodeEnum,
    CompanyStatusEnum,
    RoleModels,
    Trim,
    Empty,
    Model,
    BillActionEnum,
    Keys,
    Pick,
    Omit
} from '../lib/all'
import _ from 'lodash'
import { BaseModel } from './BaseModel'

export class CompanyModel extends BaseModel {
    constructor() {
        super()
        // 设置表名
        this.params = {
            TableName: Tables.ZeusPlatformCompany,
        }
        // 设置对象属性
        this.item = {
            ...this.baseitem,
            companyName: Model.StringValue,
            companyId: Model.uuid(),
            companyStatus: CompanyStatusEnum.Enable
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
        if (existErr) {
            return [existErr, 0]
        }
        if (exist) {
            return [BizErr.ItemExistErr(), 0]
        }
        // 保存
        const [putErr, putRet] = await this.putItem({
            ...this.item,
            ...companyInfo
        })
        if (putErr) {
            return [putErr, 0]
        }
        return [0, putRet]
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
    changeStatus(companyName, companyId, status) {
        return new Promise((reslove, reject) => {
            const params = {
                ...this.params,
                Key: {
                    'companyName': companyName,
                    'companyId': companyId
                },
                UpdateExpression: "SET companyStatus = :status",
                ExpressionAttributeValues: {
                    ':status': status
                }
            }
            this.db$('update', params)
                .then((res) => {
                    return reslove([0, res])
                }).catch((err) => {
                    return reslove([BizErr.DBErr(err.toString()), 0])
                })
        })
    }

    /**
     * 查询单个厂商
     * @param {*} companyName
     * @param {*} companyId
     */
    getOne(companyName, companyId) {
        return new Promise((reslove, reject) => {
            const params = {
                ...this.params,
                KeyConditionExpression: 'companyName = :companyName and companyId = :companyId',
                ExpressionAttributeValues: {
                    ':companyName': companyName,
                    ':companyId': companyId
                }
            }
            this.db$('query', params)
                .then((res) => {
                    if(res.Items.length > 0){
                        res = res.Items[0]
                    }
                    return reslove([0, res])
                }).catch((err) => {
                    return reslove([BizErr.DBErr(err.toString()), false])
                })
        })
    }
}


