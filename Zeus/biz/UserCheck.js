const athena = require("../lib/athena")
export class UserCheck {
    /**
     * 检查管理员
     */
    checkAdmin(inparam) {
        let [checkAttError, errorParams] = athena.Util.checkProperties([
            { name: "username", type: "S", min: 6, max: 16 },
            { name: "password", type: "S", min: 6, max: 16 },
            { name: "role", type: "N", min: 1, max: 100 },
            { name: "adminName", type: "S", min: 1, max: 16 },
            { name: "adminContact", type: "S", min: 1, max: 16 },
            { name: "adminEmail", type: "NREG", min: null, max: null, equal: athena.RegEnum.EMAIL }
        ], inparam)
        return [checkAttError, errorParams]
    }
    /**
     * 检查普通用户
     */
    checkUser(inparam) {
        let [checkAttError, errorParams] = athena.Util.checkProperties([
            { name: "username", type: "S", min: 6, max: 16 },
            { name: "password", type: "S", min: 6, max: 16 },
            { name: "role", type: "N", min: 1, max: 100 },
            { name: "adminName", type: "NS", min: 1, max: 16 },
            { name: "managerName", type: "NS", min: 1, max: 16 },
            { name: "merchantName", type: "NS", min: 1, max: 16 },
            { name: "adminContact", type: "NS", min: 1, max: 16 },
            { name: "displayName", type: "S", min: 1, max: 16 },
            { name: "remark", type: "NS", min: 1, max: 100 },
            { name: "hostName", type: "S", min: 1, max: 16 },
            { name: "hostContact", type: "S", min: 1, max: 16 },
            { name: "limit", type: "NN", min: 1, max: 10 },
            { name: "rate", type: "REG", min: null, max: null, equal: athena.RegEnum.PRICE },
            { name: "adminEmail", type: "NREG", min: null, max: null, equal: athena.RegEnum.EMAIL },
            { name: "managerEmail", type: "NREG", min: null, max: null, equal: athena.RegEnum.EMAIL },
            { name: "merchantEmail", type: "NREG", min: null, max: null, equal: athena.RegEnum.EMAIL },
            { name: "points", type: "REG", min: null, max: null, equal: athena.RegEnum.PRICE }]
            , inparam)
        return [checkAttError, errorParams]
    }

    /**
     * 检查用户状态变更入参
     * @param {*} inparam 
     */
    checkStatus(inparam) {
        let [checkAttError, errorParams] = athena.Util.checkProperties([
            { name: "role", type: "N", min: 1, max: 100 },
            { name: "userId", type: "S", min: 36, max: 36 },
            { name: "status", type: "N", min: 0, max: 1 }]
            , inparam)
        return [checkAttError, errorParams]
    }

    /**
     * 检查用户密码变更
     * @param {*} inparam 
     */
    checkPassword(inparam) {
        let [checkAttError, errorParams] = athena.Util.checkProperties([
            { name: "userId", type: "S", min: 36, max: 36 },
            { name: "password", type: "S", min: 6, max: 16 }]
            , inparam)
        return [checkAttError, errorParams]
    }
}