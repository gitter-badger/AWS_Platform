const athena = require("../lib/athena")
export class MsnCheck {
    /**
     * 检查线路号锁定/解锁入参
     * @param {*} inparam s
     */
    checkMsnLock(inparam) {
        let [checkAttError, errorParams] = athena.Util.checkProperties([
            { name: "msn", type: "N", min: 1, max: 999 },
            { name: "status", type: "N", min: 0, max: 2 }]
            , inparam)
        return [checkAttError, errorParams]
    }
}