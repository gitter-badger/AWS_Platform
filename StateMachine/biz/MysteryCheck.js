const athena = require("../lib/athena")
export class MysteryCheck {
    /**
     * 检查查询参数
     * @param {*} inparam
     */
    check(inparam) {
        let [checkAttError, errorParams] = athena.Util.checkProperties([
            { name: "role", type: "NN", min: 1, max: 10000 }]
            , inparam)

        if (checkAttError) {
            Object.assign(checkAttError, { params: errorParams })
            throw checkAttError
        }

        return [checkAttError, errorParams]
    }
}