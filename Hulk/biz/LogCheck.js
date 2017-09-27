import { Codes, Model, RoleCodeEnum } from '../lib/all'
const athena = require("../lib/athena")
export class LogCheck {
    /**
     * 检查日志数据
     */
    checkPage(inparam) {
        let [checkAttError, errorParams] = athena.Util.checkProperties([
            { name: "role", type: "N", min: 1, max: 1000 },
            { name: "level", type: "NN", min: -1, max: 0 },
            { name: "pageSize", type: "N", min: 1, max: 99999 }
        ], inparam)

        if(checkAttError){
            Object.assign(checkAttError, { params: errorParams })
            throw checkAttError
        }

        // 数据类型处理
        inparam.role = inparam.role.toString()
        inparam.level = parseInt(inparam.level)
        inparam.pageSize = parseInt(inparam.pageSize)

        return [checkAttError, errorParams]
    }
}