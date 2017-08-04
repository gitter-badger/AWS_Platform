const athena = require("../lib/athena")
export class BillCheck {
    /**
     * 检查转账数据
     */
    checkBill(inparam) {
        let [checkAttError, errorParams] = athena.Util.checkProperties([
            { name: "fromUserId", type: "S", min: 36, max: 36 },
            { name: "toRole", type: "N", min: 1, max: 100 },
            { name: "toUser", type: "S", min: 6, max: 30 },
            { name: "amount", type: "REG", min: null, max: null, equal: athena.RegEnum.PRICE },
            { name: "remark", type: "NS", min: 1, max: 200 }
        ], inparam)

        // 数据类型处理
        inparam.amount = parseFloat(inparam.amount)
        inparam.toRole = inparam.toRole.toString()
        inparam.remark = billInfo.remark || Model.StringValue

        return [checkAttError, errorParams]
    }
}