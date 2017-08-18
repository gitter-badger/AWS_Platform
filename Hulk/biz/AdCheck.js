import { Codes, Model, RoleCodeEnum, AdStatusEnum } from '../lib/all'
const athena = require("../lib/athena")
export class AdCheck {
    /**
     * 检查数据
     */
    check(inparam) {
        let [checkAttError, errorParams] = athena.Util.checkProperties([
            { name: "adName", type: "S", min: 1, max: 20 },
            { name: "remark", type: "NS", min: 1, max: 200 }
        ], inparam)

        if (checkAttError) {
            return [checkAttError, errorParams]
        }

        if(!inparam.imgs || inparam.imgs.length < 1 || inparam.imgs.length > 5){
            return [{ "imgs": -1, "msg": "需要图片1-5张", "params": ["imgs"] }, 'imgs']
        }

        // 数据类型处理
        inparam.adStatus = AdStatusEnum.Enable
        inparam.remark = inparam.remark || Model.StringValue

        return [checkAttError, errorParams]
    }

    /**
     * 检查状态变更入参
     * @param {*} inparam 
     */
    checkStatus(inparam) {
        let [checkAttError, errorParams] = athena.Util.checkProperties([
            { name: "adId", type: "N", min: 100000, max: 999999 },
            { name: "status", type: "N", min: 0, max: 1 }]
            , inparam)

        if (checkAttError) {
            return [checkAttError, errorParams]
        }

        // 数据类型处理
        inparam.adId = inparam.adId.toString()
        inparam.status = parseInt(inparam.status)

        return [checkAttError, errorParams]
    }

    /**
     * 检查更新
     * @param {*} inparam 
     */
    checkUpdate(inparam) {
        let [checkAttError, errorParams] = athena.Util.checkProperties([
            { name: "adId", type: "N", min: 100000, max: 999999 },
            { name: "adName", type: "S", min: 1, max: 20 },
            { name: "adStatus", type: "N", min: 0, max: 1 },

            { name: "remark", type: "NS", min: 1, max: 200 }
        ], inparam)

        if (checkAttError) {
            return [checkAttError, errorParams]
        }

        if(!inparam.imgs || inparam.imgs.length < 1 || inparam.imgs.length > 5){
            return [{ "imgs": -1, "msg": "需要图片1-5张", "params": ["imgs"] }, 'imgs']
        }

        // 数据类型处理
        inparam.adId = inparam.adId.toString()
        // inparam.adStatus = parseInt(inparam.adStatus)
        inparam.remark = inparam.remark || Model.StringValue

        return [checkAttError, errorParams]
    }

    /**
     * 检查删除
     * @param {*} inparam 
     */
    checkDelete(inparam) {
        let [checkAttError, errorParams] = athena.Util.checkProperties([
            { name: "adId", type: "N", min: 100000, max: 999999 }]
            , inparam)

        if (checkAttError) {
            return [checkAttError, errorParams]
        }

        // 数据类型处理
        inparam.adId = inparam.adId.toString()

        return [checkAttError, errorParams]
    }
}