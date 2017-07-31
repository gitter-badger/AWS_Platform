const athena = require("../lib/athena")
export class CompanyCheck {
    /**
     * 检查游戏厂商数据
     */
    checkCompany(inparam) {
        let [checkAttError, errorParams] = athena.Util.checkProperties([
            { name: "companyName", type: "S", min: 1, max: 20 },
            { name: "companyDesc", type: "NS", min: 1, max: 200 },
            { name: "companyContactWay", type: "S", min: 1, max: 30 },
            { name: "companyEmail", type: "REG", min: null, max: null, equal: athena.RegEnum.EMAIL },
            { name: "companyRegion", type: "S", min: 1, max: 20 },
            { name: "companyContract", type: "NS", min: 1, max: 20 },
            { name: "license", type: "NS", min: 1, max: 20 },
            { name: "remark", type: "S", min: 1, max: 200 }
        ], inparam)
        return [checkAttError, errorParams]
    }
}