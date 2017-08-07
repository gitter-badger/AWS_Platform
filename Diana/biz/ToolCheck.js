import { Codes, Model, RoleCodeEnum, ToolStatusEnum } from '../lib/all'
const athena = require("../lib/athena")
export class ToolCheck {
    /**
     * 检查道具数据
     */
    check(inparam) {
        let [checkAttError, errorParams] = athena.Util.checkProperties([
            { name: "toolName", type: "S", min: 1, max: 10 },
            { name: "remark", type: "NS", min: 1, max: 200 },
            { name: "order", type: "NN", min: 1, max: 999999999 }
        ], inparam)

        if(checkAttError){
            return [checkAttError, errorParams]
        }

        // 数据类型处理
        inparam.toolStatus = ToolStatusEnum.Enable
        inparam.remark = inparam.remark || Model.StringValue
        inparam.order = inparam.order || Model.NumberValue
        inparam.img = inparam.img || Model.StringValue

        return [checkAttError, errorParams]
    }

    /**
     * 检查状态变更入参
     * @param {*} inparam 
     */
    checkStatus(inparam) {
        let [checkAttError, errorParams] = athena.Util.checkProperties([
            { name: "toolName", type: "S", min: 1, max: 10 },
            { name: "toolId", type: "N", min: 100000, max: 999999 },
            { name: "status", type: "N", min: 0, max: 1 }]
            , inparam)
        
        if(checkAttError){
            return [checkAttError, errorParams]
        }

        // 数据类型处理
        inparam.toolId = parseInt(inparam.toolId)
        inparam.status = parseInt(inparam.status)

        return [checkAttError, errorParams]
    }

    /**
     * 检查更新
     * @param {*} inparam 
     */
    checkUpdate(inparam) {
        let [checkAttError, errorParams] = athena.Util.checkProperties([
            { name: "toolName", type: "S", min: 1, max: 10 },
            { name: "toolId", type: "N", min: 100000, max: 999999 },
            { name: "price", type: "REG", min: null, max: null, equal: athena.RegEnum.PRICE },
            { name: "num", type: "N", min: 0, max: 999999999 },
            { name: "order", type: "N", min: 0, max: 999999999 },
            { name: "status", type: "N", min: 0, max: 2 }]
            , inparam)
        
        if(checkAttError){
            return [checkAttError, errorParams]
        }
        
        // 数据类型处理
        inparam.toolId = inparam.toolId.toString()
        inparam.status = parseInt(inparam.status)
        inparam.order = parseInt(inparam.order)
        inparam.num = parseInt(inparam.num)
        inparam.price = parseFloat(inparam.price)

        return [checkAttError, errorParams]
    }
}