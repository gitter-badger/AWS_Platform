const athena = require("../lib/athena")
export class CaptchaCheck {
    /**
     * 检查验证码
     * @param {*} inparam
     */
    checkCaptcha(inparam) {
        let [checkAttError, errorParams] = athena.Util.checkProperties([
            { name: "usage", type: "S", min: 1, max: 20 },
            { name: "relKey", type: "S", min: 1, max: 30 }]
            , inparam)

        if (checkAttError) {
            Object.assign(checkAttError, { params: errorParams })
            throw checkAttError
        }

        return [checkAttError, errorParams]
    }
}