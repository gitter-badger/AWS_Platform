const athena = require("../lib/athena")
export class CaptchaCheck {
    /**
     * 检查验证码
     * @param {*} inparam
     */
    checkCaptcha(inparam) {
        let [checkAttError, errorParams] = athena.Util.checkProperties([
            { name: "usage", type: "S", min: 1, max: 20 },
            { name: "relKey", type: "S", min: 6, max: 30 }]
            , inparam)
        return [checkAttError, errorParams]
    }
}