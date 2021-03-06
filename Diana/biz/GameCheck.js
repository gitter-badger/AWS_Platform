import { Codes, Model, RoleCodeEnum, GameTypeEnum, GameStatusEnum } from '../lib/all'
const athena = require("../lib/athena")
export class GameCheck {
    /**
     * 检查游戏数据
     */
    checkGame(inparam) {
        let [checkAttError, errorParams] = athena.Util.checkProperties([
            { name: "gameName", type: "REG", min: null, max: null, equal: athena.RegEnum.COMPANYNAME },
            { name: "gameRecommend", type: "S", min: 2, max: 200 },
            { name: "gameType", type: "N", min: 10000, max: 90000 },
            { name: "ip", type: "REG", min: null, max: null, equal: athena.RegEnum.IP },
            { name: "port", type: "N", min: 1, max: 65535 },
            { name: "kindId", type: "N", min: 10000, max: 99999 },

            { name: "gameImg", type: "NREG", min: null, max: null, equal: athena.RegEnum.URL }
        ], inparam)

        if (checkAttError) {
            Object.assign(checkAttError, { params: errorParams })
            throw checkAttError
        }

        // 检查子对象
        if (!inparam.company || !inparam.company.companyName || !inparam.company.companyId) {
            throw { "code": -1, "msg": "游戏厂商数据不合法", "params": ["company"] }
        }

        // 数据类型处理
        inparam.gameType = inparam.gameType.toString()
        inparam.kindId = inparam.kindId.toString()

        inparam.gameStatus = GameStatusEnum.Online
        inparam.gameImg = inparam.gameImg || Model.StringValue
        inparam.company = inparam.company || Model.StringValue

        // 精细检查
        if (!GameTypeEnum[inparam.gameType]) {
            throw { "code": -1, "msg": "游戏类型不合法", "params": ["gameType"] }
        }
        if (inparam.gameType.charAt(0) != inparam.kindId.charAt(0)) {
            throw { "code": -1, "msg": "kindId必须与游戏类型一致", "params": ["kindId"] }
        }

        return [checkAttError, errorParams]
    }

    /**
     * 检查游戏状态变更入参
     * @param {*} inparam 
     */
    checkStatus(inparam) {
        let [checkAttError, errorParams] = athena.Util.checkProperties([
            { name: "gameType", type: "N", min: 10000, max: 90000 },
            { name: "gameId", type: "S", min: 36, max: 36 },
            { name: "status", type: "N", min: 0, max: 4 }]
            , inparam)

        if (checkAttError) {
            Object.assign(checkAttError, { params: errorParams })
            throw checkAttError
        }

        // 数据类型处理
        inparam.status = parseInt(inparam.status)

        // 精细检查
        if (!GameTypeEnum[inparam.gameType]) {
            throw { "code": -1, "msg": "游戏类型不合法", "params": ["gameType"] }
        }

        return [checkAttError, errorParams]
    }

    /**
     * 检查查询
     * @param {*} inparam 
     */
    checkQuery(inparam) {
        let [checkAttError, errorParams] = athena.Util.checkProperties([
            { name: "gameType", type: "NS", min: 5, max: 170 }]
            , inparam)

        if (checkAttError) {
            Object.assign(checkAttError, { params: errorParams })
            throw checkAttError
        }

        // 如果类型参数为空，默认查询所有类型
        if (!inparam.gameType) {
            inparam.gameType = ''
            for (let item in GameTypeEnum) {
                inparam.gameType += (item + ',')
            }
            inparam.gameType = inparam.gameType.substr(0, inparam.gameType.length - 1)
        }

        // 数据类型处理
        inparam.gameType = inparam.gameType.toString()
        inparam.keyword = inparam.keyword || null

        return [checkAttError, errorParams]
    }
}