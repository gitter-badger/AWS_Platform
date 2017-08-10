import { Model, SeatStatusEnum, SeatTypeEnum } from '../lib/all'
const athena = require("../lib/athena")
export class SeatCheck {
    /**
     * 检查数据
     */
    check(inparam) {
        let [checkAttError, errorParams] = athena.Util.checkProperties([
            { name: "seatType", type: "N", min: 1, max: 2 },
            { name: "order", type: "N", min: 1, max: 99999 },
            { name: "price", type: "REG", min: null, max: null, equal: athena.RegEnum.PRICE },
            { name: "sum", type: "N", min: 1, max: 100000000 },
            { name: "seatStatus", type: "N", min: 1, max: 2 },
            { name: "remark", type: "NS", min: 1, max: 200 }
        ], inparam)

        if (checkAttError) {
            return [checkAttError, errorParams]
        }

        // 数据类型处理
        inparam.seatStatus = parseInt(inparam.seatStatus)
        inparam.order = parseInt(inparam.order)
        inparam.sum = parseInt(inparam.sum)
        inparam.price = parseFloat(inparam.price)
        inparam.seatType = inparam.seatType.toString()
        inparam.remark = inparam.remark || Model.StringValue

        return [checkAttError, errorParams]
    }

    /**
     * 检查状态变更入参
     * @param {*} inparam 
     */
    checkStatus(inparam) {
        let [checkAttError, errorParams] = athena.Util.checkProperties([
            { name: "seatId", type: "S", min: 36, max: 36 },
            { name: "status", type: "N", min: 0, max: 2 }]
            , inparam)

        if (checkAttError) {
            return [checkAttError, errorParams]
        }

        // 数据类型处理
        inparam.status = parseInt(inparam.status)

        return [checkAttError, errorParams]
    }

    /**
     * 检查更新
     * @param {*} inparam 
     */
    checkUpdate(inparam) {
        let [checkAttError, errorParams] = athena.Util.checkProperties([
            { name: "seatId", type: "S", min: 36, max: 36 },
            { name: "seatType", type: "N", min: 1, max: 2 },
            { name: "order", type: "N", min: 1, max: 99999 },
            { name: "price", type: "REG", min: null, max: null, equal: athena.RegEnum.PRICE },
            { name: "sum", type: "N", min: 1, max: 100000000 },
            { name: "seatStatus", type: "N", min: 1, max: 2 },
            { name: "remark", type: "NS", min: 1, max: 200 }
        ], inparam)

        if (checkAttError) {
            return [checkAttError, errorParams]
        }

        // 数据类型处理
        inparam.seatStatus = parseInt(inparam.seatStatus)
        inparam.order = parseInt(inparam.order)
        inparam.sum = parseInt(inparam.sum)
        inparam.price = parseFloat(inparam.price)
        inparam.seatType = inparam.seatType.toString()
        inparam.remark = inparam.remark || Model.StringValue

        return [checkAttError, errorParams]
    }

    /**
     * 检查删除
     * @param {*} inparam 
     */
    checkDelete(inparam) {
        let [checkAttError, errorParams] = athena.Util.checkProperties([
            { name: "seatId", type: "S", min: 36, max: 36 }]
            , inparam)

        if (checkAttError) {
            return [checkAttError, errorParams]
        }

        // 数据类型处理

        return [checkAttError, errorParams]
    }
}