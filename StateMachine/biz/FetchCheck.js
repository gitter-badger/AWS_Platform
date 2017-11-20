const athena = require("../lib/athena")
export class FetchCheck {
    /**
     * 检查获取用户
     * @param {*} inparam
     */
    checkFetchUser(inparam) {
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