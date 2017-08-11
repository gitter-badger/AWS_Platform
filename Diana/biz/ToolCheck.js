import { Codes, Model, RoleCodeEnum, ToolStatusEnum } from '../lib/all'
const athena = require("../lib/athena")
export class ToolCheck {
    /**
     * 检查道具数据
     */
    check(inparam) {
        let [checkAttError, errorParams] = athena.Util.checkProperties([
            { name: "toolName", type: "S", min: 1, max: 20 },

            { name: "icon", type: "NS", min: 1, max: 256 },
            { name: "desc", type: "NS", min: 1, max: 200 },
            { name: "remark", type: "NS", min: 1, max: 200 }
        ], inparam)

        if (checkAttError) {
            return [checkAttError, errorParams]
        }

        // 数据类型处理
        inparam.toolStatus = ToolStatusEnum.Enable
        inparam.icon = inparam.icon || Model.StringValue
        inparam.desc = inparam.desc || Model.StringValue
        inparam.remark = inparam.remark || Model.StringValue

        return [checkAttError, errorParams]
    }

    /**
     * 检查状态变更入参
     * @param {*} inparam 
     */
    checkStatus(inparam) {
        let [checkAttError, errorParams] = athena.Util.checkProperties([
            { name: "toolName", type: "S", min: 1, max: 20 },
            { name: "toolId", type: "N", min: 100000, max: 999999 },
            { name: "status", type: "N", min: 0, max: 1 }]
            , inparam)

        if (checkAttError) {
            return [checkAttError, errorParams]
        }

        // 数据类型处理
        inparam.toolId = inparam.toolId.toString()
        inparam.status = parseInt(inparam.status)

        return [checkAttError, errorParams]
    }

    /**
     * 检查更新
     * @param {*} inparam 
     */
    checkUpdate(inparam) {
        let [checkAttError, errorParams] = athena.Util.checkProperties([
            { name: "toolId", type: "N", min: 100000, max: 999999 },
            { name: "toolName", type: "S", min: 1, max: 20 },
            { name: "toolStatus", type: "N", min: 0, max: 1 },

            { name: "icon", type: "NS", min: 1, max: 256 },
            { name: "desc", type: "NS", min: 1, max: 200 },
            { name: "remark", type: "NS", min: 1, max: 200 }
        ], inparam)

        if (checkAttError) {
            return [checkAttError, errorParams]
        }

        // 数据类型处理
        inparam.toolId = inparam.toolId.toString()
        inparam.toolStatus = parseInt(inparam.toolStatus)
        inparam.icon = inparam.icon || Model.StringValue
        inparam.desc = inparam.desc || Model.StringValue
        inparam.remark = inparam.remark || Model.StringValue

        return [checkAttError, errorParams]
    }

    /**
     * 检查删除
     * @param {*} inparam 
     */
    checkDelete(inparam) {
        let [checkAttError, errorParams] = athena.Util.checkProperties([
            { name: "toolId", type: "N", min: 100000, max: 999999 }]
            , inparam)

        if (checkAttError) {
            return [checkAttError, errorParams]
        }

        // 数据类型处理

        return [checkAttError, errorParams]
    }
}