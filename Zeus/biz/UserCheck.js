const athena = require("../lib/athena")
export class UserCheck {
    /**
     * 检查管理员
     */
    checkAdmin(inparam) {
        let [checkAttError, errorParams] = athena.Util.checkProperties([
            { name: "username", type: "REG", min: null, max: null, equal: athena.RegEnum.USERNAME },
            { name: "password", type: "S", min: 6, max: 16 },
            { name: "role", type: "N", min: 1, max: 100 },
            { name: "adminName", type: "REG", min: null, max: null, equal: athena.RegEnum.HOSTNAME },
            { name: "adminContact", type: "S", min: 1, max: 40 },
            { name: "adminEmail", type: "REG", min: null, max: null, equal: athena.RegEnum.EMAIL },

            { name: "displayName", type: "NREG", min: null, max: null, equal: athena.RegEnum.DISPLAYNAME },
            { name: "hostContact", type: "NS", min: 5, max: 40 },

            { name: "remark", type: "NS", min: 1, max: 200 }
        ], inparam)
        return [checkAttError, errorParams]
    }
    /**
     * 检查普通用户
     */
    checkUser(inparam) {
        let [checkAttError, errorParams] = athena.Util.checkProperties([
            { name: "suffix", type: "REG", min: null, max: null, equal: athena.RegEnum.SUFFIX },
            { name: "displayName", type: "REG", min: null, max: null, equal: athena.RegEnum.DISPLAYNAME },
            { name: "hostName", type: "REG", min: null, max: null, equal: athena.RegEnum.HOSTNAME },
            { name: "rate", type: "REG", min: null, max: null, equal: athena.RegEnum.RATE },
            { name: "points", type: "REG", min: null, max: null, equal: athena.RegEnum.PRICE },
            { name: "username", type: "REG", min: null, max: null, equal: athena.RegEnum.USERNAME },
            { name: "password", type: "S", min: 6, max: 16 },
            { name: "role", type: "N", min: 1, max: 100 },
            { name: "limit", type: "N", min: 1, max: 10 },
            { name: "hostContact", type: "S", min: 5, max: 40 },

            { name: "adminName", type: "NREG", min: null, max: null, equal: athena.RegEnum.HOSTNAME },
            { name: "adminEmail", type: "NREG", min: null, max: null, equal: athena.RegEnum.EMAIL },
            { name: "adminContact", type: "NS", min: 1, max: 40 },

            { name: "managerName", type: "NREG", min: null, max: null, equal: athena.RegEnum.HOSTNAME },
            { name: "managerEmail", type: "NREG", min: null, max: null, equal: athena.RegEnum.EMAIL },
            { name: "managerContact", type: "NS", min: 5, max: 40 },

            { name: "merchantName", type: "NREG", min: null, max: null, equal: athena.RegEnum.HOSTNAME },
            { name: "merchantEmail", type: "NREG", min: null, max: null, equal: athena.RegEnum.EMAIL },
            { name: "merchantContact", type: "NS", min: 5, max: 40 },

            { name: "remark", type: "NS", min: 1, max: 200 }]
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