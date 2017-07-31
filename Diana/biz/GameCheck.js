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
            { name: "gameImg", type: "REG", min: null, max: null, equal: athena.RegEnum.URL },
            { name: "ip", type: "REG", min: null, max: null, equal: athena.RegEnum.IP  },
            { name: "port", type: "N", min: 1, max: 65535 }
        ], inparam)
        return [checkAttError, errorParams]
    }
}