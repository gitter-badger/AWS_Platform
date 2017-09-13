import { Codes, Model, RoleCodeEnum, ConfigStatusEnum } from '../lib/all'
const athena = require("../lib/athena")
export class ConfigCheck {
    /**
     * 检查数据
     */
    checkQueue(inparam) {
        let [checkAttError, errorParams] = athena.Util.checkProperties([
            { name: "status", type: "N", min: 0, max: 1 },
            { name: "countPeople", type: "N", min: 1, max: 1000 },
            { name: "countTime", type: "N", min: 1, max: 10000 }
        ], inparam)

        if (checkAttError) {
            Object.assign(checkAttError, { params: errorParams })
            throw checkAttError
        }

        // 数据类型处理
        inparam.status = parseInt(inparam.status)
        inparam.countPeople = parseInt(inparam.countPeople)
        inparam.countTime = parseInt(inparam.countTime)
        inparam.code = 'queue'

        return [checkAttError, errorParams]
    }
}