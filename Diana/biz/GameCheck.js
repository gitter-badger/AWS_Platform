import {Codes,Model,RoleCodeEnum,GameTypeEnum,GameStatusEnum} from '../lib/all'
const athena = require("../lib/athena")
export class GameCheck {
    /**
     * 检查游戏数据
     */
    checkGame(inparam) {
        let [checkAttError, errorParams] = athena.Util.checkProperties([
            { name: "gameName", type: "REG", min: null, max: null, equal: athena.RegEnum.COMPANYNAME },
            { name: "gameRecommend", type: "REG", min: null, max: null, equal: athena.RegEnum.COMPANYDESC },
            { name: "gameType", type: "N", min: 10000, max: 90000 },
            { name: "ip", type: "REG", min: null, max: null, equal: athena.RegEnum.IP },
            { name: "port", type: "N", min: 1, max: 65535 },
            { name: "kindId", type: "N", min: 10000, max: 99999 },

            { name: "gameImg", type: "NREG", min: null, max: null, equal: athena.RegEnum.URL }
        ], inparam)

        if(checkAttError){
            return [checkAttError, errorParams]
        }

        // 数据类型处理
        inparam.gameType = inparam.gameType.toString()
        inparam.gameStatus = GameStatusEnum.Online
        inparam.gameImg = inparam.gameImg || Model.StringValue
        inparam.company = inparam.company || Model.StringValue
        inparam.ip = inparam.ip || Model.StringValue
        inparam.port = inparam.port || Model.StringValue
        inparam.kindId = inparam.kindId.toString()

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
        
        if(checkAttError){
            return [checkAttError, errorParams]
        }

        // 数据类型处理
        inparam.status = parseInt(inparam.status)

        return [checkAttError, errorParams]
    }
}