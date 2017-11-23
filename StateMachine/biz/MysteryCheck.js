import { Codes,CodeStatus, Model, RoleCodeEnum } from '../lib/all'
const athena = require("../lib/athena")
export class MysteryCheck {
    /**
     * 检查查询参数
     * @param {*} inparam
     */
    check(inparam) {
        let [checkAttError, errorParams] = athena.Util.checkProperties([
        ], inparam)

        if (checkAttError) {
            Object.assign(checkAttError, { params: errorParams })
            throw checkAttError
        }

        // 数据类型转换
        inparam.status = CodeStatus.Receive
        inparam.receiveAt = 0
        inparam.winAt = parseInt(inparam.winAt)

        return [checkAttError, errorParams]
    }
}