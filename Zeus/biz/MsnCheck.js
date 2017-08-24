const athena = require("../lib/athena")
export class MsnCheck {
    check(inparam) {
        let [checkAttError, errorParams] = athena.Util.checkProperties([
            { name: "msn", type: "N", min: 1, max: 999 }]
            , inparam)

        if (checkAttError) {
            Object.assign(checkAttError, { params: errorParams })
            throw [checkAttError, errorParams]
        }

        inparam.msn = parseInt(inparam.msn).toString()
        return [checkAttError, errorParams]
    }
    /**
     * 检查线路号锁定/解锁入参
     * @param {*} inparam s
     */
    checkMsnLock(inparam) {
        let [checkAttError, errorParams] = athena.Util.checkProperties([
            { name: "msn", type: "N", min: 1, max: 999 },
            { name: "status", type: "N", min: 0, max: 2 }]
            , inparam)

        if (checkAttError) {
            Object.assign(checkAttError, { params: errorParams })
            throw [checkAttError, errorParams]
        }

        inparam.msn = parseInt(inparam.msn).toString()
        inparam.status = parseInt(inparam.status)
        return [checkAttError, errorParams]
    }
}