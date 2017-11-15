import { Codes, Model, RoleCodeEnum } from '../lib/all'
const athena = require("../lib/athena")
export class UserRankCheck {
    /**
     * 检查入参
     */
    check(inparam) {
        let [checkAttError, errorParams] = athena.Util.checkProperties([
            { name: "sortkey", type: "S", min: 3, max: 7 },
            { name: "userName", type: "S", min: 1, max: 99999 }
        ], inparam)
        if (checkAttError) {
            Object.assign(checkAttError, { params: errorParams })
            throw checkAttError
        }
        // 数据类型处理
        return [checkAttError, errorParams]
    }
}