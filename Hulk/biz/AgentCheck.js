import { Codes, Model, RoleCodeEnum } from '../lib/all'
const athena = require("../lib/athena")
export class AgentCheck {
    /**
     * 检查代理管理员
     */
    checkAdmin(inparam) {
        if (passwordLevel(inparam.password) < 3) {
            throw { "code": -1, "msg": "密码强度不足", "params": ["password"] }
        }
        let [checkAttError, errorParams] = athena.Util.checkProperties([
            { name: "role", type: "N", min: 1000, max: 1000 },
            { name: "username", type: "REG", min: null, max: null, equal: athena.RegEnum.USERNAME },
            { name: "password", type: "S", min: 6, max: 16 },
            { name: "hostContact", type: "S", min: 5, max: 40 },
            { name: "hostName", type: "REG", min: null, max: null, equal: athena.RegEnum.HOSTNAME },
            // 代理
            { name: "agentEmail", type: "REG", min: null, max: null, equal: athena.RegEnum.EMAIL },

            { name: "rate", type: "NREG", min: null, max: null, equal: athena.RegEnum.RATE },
            { name: "vedioMix", type: "NREG", min: null, max: null, equal: athena.RegEnum.RATE },
            { name: "liveMix", type: "NREG", min: null, max: null, equal: athena.RegEnum.RATE },

            // 帐号管理员
            // { name: "adminName", type: "REG", min: null, max: null, equal: athena.RegEnum.HOSTNAME },
            // { name: "adminEmail", type: "REG", min: null, max: null, equal: athena.RegEnum.EMAIL },
            // { name: "adminContact", type: "S", min: 1, max: 40 },

            { name: "remark", type: "NS", min: 1, max: 200 }]
            , inparam)

        if (checkAttError) {
            Object.assign(checkAttError, { params: errorParams })
            throw checkAttError
        }
        // 数据类型处理
        // inparam.rate = inparam.rate.toString()
        inparam.points = parseFloat(Model.PlatformAdminDefaultPoints)
        inparam.role = RoleCodeEnum.Agent
        inparam.suffix = 'Agent'
        inparam.displayName = '代理管理员'
        inparam.parent = Model.NoParent
        inparam.contractPeriod = 0
        inparam.isforever = true
        inparam.level = 0
        inparam.levelIndex = 0
        inparam.rate = "100.00"
        inparam.vedioMix = 100.00
        inparam.liveMix = 100.00

        return [checkAttError, errorParams]
    }
    /**
     * 检查代理
     */
    check(inparam) {
        if (passwordLevel(inparam.password) < 3) {
            throw { "code": -1, "msg": "密码强度不足", "params": ["password"] }
        }
        let [checkAttError, errorParams] = athena.Util.checkProperties([
            { name: "role", type: "N", min: 1000, max: 1000 },
            { name: "suffix", type: "REG", min: null, max: null, equal: athena.RegEnum.SUFFIX },
            { name: "username", type: "REG", min: null, max: null, equal: athena.RegEnum.USERNAME },
            { name: "password", type: "S", min: 6, max: 16 },
            { name: "rate", type: "REG", min: null, max: null, equal: athena.RegEnum.RATE },
            { name: "points", type: "REG", min: null, max: null, equal: athena.RegEnum.PRICE },
            { name: "displayName", type: "REG", min: null, max: null, equal: athena.RegEnum.DISPLAYNAME },
            { name: "hostContact", type: "S", min: 5, max: 40 },
            { name: "hostName", type: "REG", min: null, max: null, equal: athena.RegEnum.HOSTNAME },
            { name: "vedioMix", type: "REG", min: null, max: null, equal: athena.RegEnum.RATE },
            { name: "liveMix", type: "REG", min: null, max: null, equal: athena.RegEnum.RATE },

            // 代理
            { name: "agentEmail", type: "REG", min: null, max: null, equal: athena.RegEnum.EMAIL },

            // 帐号管理员
            // { name: "adminName", type: "REG", min: null, max: null, equal: athena.RegEnum.HOSTNAME },
            // { name: "adminEmail", type: "REG", min: null, max: null, equal: athena.RegEnum.EMAIL },
            // { name: "adminContact", type: "S", min: 1, max: 40 },

            { name: "remark", type: "NS", min: 1, max: 200 }]
            , inparam)

        if (checkAttError) {
            Object.assign(checkAttError, { params: errorParams })
            throw checkAttError
        }

        if (inparam.suffix == 'Agent') {
            throw { "code": -1, "msg": "该前缀已系统保留", "params": ["suffix"] }
        }
        if ((!inparam.contractPeriod && inparam.contractPeriod != 0) || (inparam.isforever !== true && inparam.isforever !== false)) {
            throw { "code": -1, "msg": "有效期不能为空", "params": ["contractPeriod"] }
        }

        // 数据类型处理
        inparam.rate = inparam.rate.toString()
        inparam.points = parseFloat(inparam.points)
        inparam.role = RoleCodeEnum.Agent
        
        return [checkAttError, errorParams]
    }

    /**
     * 检查代理更新
     */
    checkUpdate(inparam) {
        if (passwordLevel(inparam.password) < 3) {
            throw { "code": -1, "msg": "密码强度不足", "params": ["password"] }
        }
        let [checkAttError, errorParams] = athena.Util.checkProperties([
            { name: "role", type: "N", min: 1000, max: 1000 },
            { name: "username", type: "REG", min: null, max: null, equal: athena.RegEnum.USERNAME_UPDATE },
            { name: "password", type: "S", min: 6, max: 16 },
            { name: "suffix", type: "REG", min: null, max: null, equal: athena.RegEnum.SUFFIX },
            { name: "displayName", type: "REG", min: null, max: null, equal: athena.RegEnum.DISPLAYNAME },
            { name: "hostName", type: "REG", min: null, max: null, equal: athena.RegEnum.HOSTNAME },
            { name: "hostContact", type: "S", min: 5, max: 40 },
            { name: "rate", type: "REG", min: null, max: null, equal: athena.RegEnum.RATE },
            { name: "points", type: "REG", min: null, max: null, equal: athena.RegEnum.PRICE },
            { name: "vedioMix", type: "REG", min: null, max: null, equal: athena.RegEnum.RATE },
            { name: "liveMix", type: "REG", min: null, max: null, equal: athena.RegEnum.RATE },

            // 帐号管理员
            // { name: "adminName", type: "REG", min: null, max: null, equal: athena.RegEnum.HOSTNAME },
            // { name: "adminEmail", type: "REG", min: null, max: null, equal: athena.RegEnum.EMAIL },
            // { name: "adminContact", type: "S", min: 1, max: 40 },

            // 代理
            { name: "agentEmail", type: "REG", min: null, max: null, equal: athena.RegEnum.EMAIL },

            { name: "remark", type: "NS", min: 1, max: 200 }]
            , inparam)

        if (checkAttError) {
            Object.assign(checkAttError, { params: errorParams })
            throw checkAttError
        }

        // 数据类型处理
        inparam.rate = inparam.rate.toString()
        inparam.points = parseFloat(inparam.points)
        inparam.role = RoleCodeEnum.Agent

        return [checkAttError, errorParams]
    }

    /**
     * 检查登录
     * @param {*} inparam 
     */
    checkLogin(inparam) {
        let [checkAttError, errorParams] = athena.Util.checkProperties([
            { name: "username", type: "REG", min: null, max: null, equal: athena.RegEnum.USERNAME },
            { name: "password", type: "S", min: 6, max: 16 },
            { name: "suffix", type: "REG", min: null, max: null, equal: athena.RegEnum.SUFFIX },
            { name: "role", type: "N", min: 1000, max: 1000 },
            { name: "captcha", type: "N", min: 1000, max: 9999 }
        ], inparam)

        if (checkAttError) {
            Object.assign(checkAttError, { params: errorParams })
            throw checkAttError
        }

        // 数据类型处理
        inparam.role = inparam.role.toString()
        inparam.captcha = parseInt(inparam.captcha)

        return [checkAttError, errorParams]
    }

    /**
     * 检查用户状态变更入参
     * @param {*} inparam 
     */
    checkStatus(inparam) {
        let [checkAttError, errorParams] = athena.Util.checkProperties([
            { name: "userId", type: "S", min: 36, max: 36 },
            { name: "status", type: "N", min: 0, max: 1 }]
            , inparam)

        if (checkAttError) {
            Object.assign(checkAttError, { params: errorParams })
            throw checkAttError
        }

        // 数据类型处理
        inparam.status = parseInt(inparam.status)

        return [checkAttError, errorParams]
    }

    /**
     * 检查用户密码变更
     * @param {*} inparam 
     */
    checkPassword(inparam) {
        if (passwordLevel(inparam.password) < 3) {
            throw { "code": -1, "msg": "密码强度不足", "params": ["password"] }
        }
        let [checkAttError, errorParams] = athena.Util.checkProperties([
            { name: "userId", type: "S", min: 36, max: 36 },
            { name: "password", type: "S", min: 6, max: 16 }]
            , inparam)

        if (checkAttError) {
            Object.assign(checkAttError, { params: errorParams })
            throw checkAttError
        }

        return [checkAttError, errorParams]
    }
}

/**
 * 返回密码强度等级
 * @param {*} password 
 */
function passwordLevel(password) {
    var Modes = 0;
    for (let i = 0; i < password.length; i++) {
        Modes |= CharMode(password.charCodeAt(i));
    }
    return bitTotal(Modes);
    //CharMode函数
    function CharMode(iN) {
        if (iN >= 48 && iN <= 57)//数字
            return 1;
        if (iN >= 65 && iN <= 90) //大写字母
            return 2;
        if ((iN >= 97 && iN <= 122) || (iN >= 65 && iN <= 90))
            //大小写
            return 4;
        else
            return 8; //特殊字符
    }
    //bitTotal函数
    function bitTotal(num) {
        let modes = 0;
        for (let i = 0; i < 4; i++) {
            if (num & 1) modes++;
            num >>>= 1;
        }
        return modes;
    }
}