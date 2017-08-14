import { Codes, Model, RoleCodeEnum } from '../lib/all'
const athena = require("../lib/athena")
export class UserCheck {
    /**
     * 检查管理员
     */
    checkAdmin(inparam) {
        if (passwordLevel(inparam.password) < 3) {
            return [{ "code": -1, "msg": "密码强度不足", "params": ["password"] }, 'password']
        }
        let [checkAttError, errorParams] = athena.Util.checkProperties([
            { name: "username", type: "REG", min: null, max: null, equal: athena.RegEnum.USERNAME },
            { name: "password", type: "S", min: 6, max: 16 },
            { name: "role", type: "N", min: 1, max: 1 },
            { name: "adminName", type: "REG", min: null, max: null, equal: athena.RegEnum.HOSTNAME },
            { name: "adminContact", type: "S", min: 1, max: 40 },
            { name: "adminEmail", type: "REG", min: null, max: null, equal: athena.RegEnum.EMAIL },

            { name: "displayName", type: "NREG", min: null, max: null, equal: athena.RegEnum.DISPLAYNAME },
            { name: "hostName", type: "NREG", min: null, max: null, equal: athena.RegEnum.HOSTNAME },
            { name: "hostContact", type: "NS", min: 5, max: 40 },

            { name: "remark", type: "NS", min: 1, max: 200 }
        ], inparam)

        if(checkAttError){
            return [checkAttError, errorParams]
        }

        // 数据类型处理
        inparam.role = inparam.role.toString()

        return [checkAttError, errorParams]
    }
    /**
     * 检查普通用户
     */
    checkUser(inparam) {
        if (passwordLevel(inparam.password) < 3) {
            return [{ "code": -1, "msg": "密码强度不足", "params": ["password"] }, 'password']
        }
        let [checkAttError, errorParams] = athena.Util.checkProperties([
            { name: "suffix", type: "REG", min: null, max: null, equal: athena.RegEnum.SUFFIX },
            { name: "displayName", type: "REG", min: null, max: null, equal: athena.RegEnum.DISPLAYNAME },
            { name: "hostName", type: "REG", min: null, max: null, equal: athena.RegEnum.HOSTNAME },
            { name: "rate", type: "REG", min: null, max: null, equal: athena.RegEnum.RATE },
            { name: "points", type: "REG", min: null, max: null, equal: athena.RegEnum.PRICE },
            { name: "username", type: "REG", min: null, max: null, equal: athena.RegEnum.USERNAME },
            { name: "password", type: "S", min: 6, max: 16 },
            { name: "role", type: "N", min: 1, max: 100 },
            { name: "hostContact", type: "S", min: 5, max: 40 },

            { name: "limit", type: "NN", min: 1, max: 10 },
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

        if(checkAttError){
            return [checkAttError, errorParams]
        }

        // 数据类型处理
        inparam.rate = inparam.rate.toString()
        inparam.points = parseFloat(inparam.points)
        inparam.role = inparam.role.toString()
        if (inparam.limit) {
            inparam.limit = parseInt(inparam.limit)
        }
        if (!inparam.parent) {
            inparam.parent = Model.DefaultParent
        }

        return [checkAttError, errorParams]
    }

    /**
     * 检查普通用户
     */
    checkUserUpdate(inparam) {
        if (passwordLevel(inparam.password) < 3) {
            return [{ "code": -1, "msg": "密码强度不足", "params": ["password"] }, 'password']
        }
        let [checkAttError, errorParams] = athena.Util.checkProperties([
            { name: "suffix", type: "REG", min: null, max: null, equal: athena.RegEnum.SUFFIX },
            { name: "displayName", type: "REG", min: null, max: null, equal: athena.RegEnum.DISPLAYNAME },
            { name: "hostName", type: "REG", min: null, max: null, equal: athena.RegEnum.HOSTNAME },
            { name: "rate", type: "REG", min: null, max: null, equal: athena.RegEnum.RATE },
            { name: "points", type: "REG", min: null, max: null, equal: athena.RegEnum.PRICE },
            { name: "username", type: "REG", min: null, max: null, equal: athena.RegEnum.USERNAME_UPDATE },
            { name: "password", type: "S", min: 6, max: 16 },
            { name: "role", type: "N", min: 1, max: 100 },
            { name: "hostContact", type: "S", min: 5, max: 40 },

            { name: "limit", type: "NN", min: 1, max: 10 },
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

        if(checkAttError){
            return [checkAttError, errorParams]
        }

        // 数据类型处理
        inparam.rate = inparam.rate.toString()
        inparam.points = parseFloat(inparam.points)
        inparam.role = inparam.role.toString()
        if (inparam.limit) {
            inparam.limit = parseInt(inparam.limit)
        }
        if (!inparam.parent) {
            inparam.parent = Model.DefaultParent
        }

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
            { name: "role", type: "N", min: 1, max: 100 }
        ], inparam)

        if(checkAttError){
            return [checkAttError, errorParams]
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

        if(checkAttError){
            return [checkAttError, errorParams]
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
            return [{ "code": -1, "msg": "密码强度不足", "params": ["password"] }, 'password']
        }
        let [checkAttError, errorParams] = athena.Util.checkProperties([
            { name: "userId", type: "S", min: 36, max: 36 },
            { name: "password", type: "S", min: 6, max: 16 }]
            , inparam)
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