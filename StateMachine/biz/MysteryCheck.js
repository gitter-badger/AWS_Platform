import { Codes, MysteryStatusEnum, Model, RoleCodeEnum } from '../lib/all'
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

        if (inparam.sourceKey != '22ecaf87-7b9f-4dd0-8802-13a428ae5e14') {
            throw { "code": -1, "msg": "非法操作", "params": ["warning"] }
        }
        delete inparam.sourceKey

        // 数据类型转换
        inparam.status = MysteryStatusEnum.Unreceived
        inparam.receiveAt = Model.NumberValue
        inparam.winAt = parseInt(inparam.winAt)
        inparam.operateNick = Model.StringValue
        inparam.operateName = Model.StringValue


        return [checkAttError, errorParams]
    }
}