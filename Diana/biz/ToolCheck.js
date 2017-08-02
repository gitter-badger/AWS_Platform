const athena = require("../lib/athena")
export class ToolCheck {
    /**
     * 检查道具数据
     */
    checkTool(inparam) {
        let [checkAttError, errorParams] = athena.Util.checkProperties([
            { name: "toolName", type: "S", min: 1, max: 20 },
            { name: "remark", type: "NS", min: 1, max: 200 }
        ], inparam)
        return [checkAttError, errorParams]
    }
}