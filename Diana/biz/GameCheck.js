const athena = require("../lib/athena")
export class GameCheck {
    /**
     * 检查游戏数据
     */
    checkGame(inparam) {
        let [checkAttError, errorParams] = athena.Util.checkProperties([
            { name: "gameName", type: "S", min: 1, max: 20 },
            { name: "gameRecommend", type: "NS", min: 1, max: 200 },
            { name: "gameType", type: "N", min: 0, max: 2 },
            { name: "gameImg", type: "NREG", min: null, max: null, equal: athena.RegEnum.URL },
            { name: "ip", type: "REG", min: null, max: null, equal: athena.RegEnum.IP },
            { name: "port", type: "N", min: 1, max: 65535 }
        ], inparam)
        return [checkAttError, errorParams]

        // if (!_.isNumber(kindId)) {
        //     return [BizErr.ParamErr('kindId should provided and kindId cant parse to number')]
        // }
    }

    /**
     * 检查游戏状态变更入参
     * @param {*} inparam 
     */
    checkStatus(inparam) {
        let [checkAttError, errorParams] = athena.Util.checkProperties([
            { name: "gameType", type: "N", min: 0, max: 2 },
            { name: "gameId", type: "S", min: 36, max: 36 },
            { name: "status", type: "N", min: 0, max: 4 }]
            , inparam)
        return [checkAttError, errorParams]
    }
}