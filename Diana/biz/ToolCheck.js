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
        return [checkAttError, errorParams]
    }
}