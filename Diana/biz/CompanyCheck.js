const athena = require("../lib/athena")
export class CompanyCheck {
    /**
     * 检查游戏厂商数据
     */
    checkCompany(inparam) {
        let [checkAttError, errorParams] = athena.Util.checkProperties([
            { name: "companyName", type: "REG", min: null, max: null, equal: athena.RegEnum.COMPANYNAME },
            { name: "companyContact", type: "REG", min: null, max: null, equal: athena.RegEnum.COMPANYCONTACT },
            { name: "companyContactWay", type: "REG", min: null, max: null, equal: athena.RegEnum.COMPANYCONTACTWAY },
            { name: "companyEmail", type: "REG", min: null, max: null, equal: athena.RegEnum.EMAIL },
            { name: "companyRegion", type: "S", min: 1, max: 20 },

            { name: "companyDesc", type: "NREG", min: null, max: null, equal: athena.RegEnum.COMPANYDESC },
            { name: "companyContract", type: "NS", min: 1, max: 50 },
            { name: "license", type: "NS", min: 1, max: 20 },
            { name: "remark", type: "NS", min: 2, max: 200 }
        ], inparam)
        return [checkAttError, errorParams]
    }

    /**
     * 检查厂商状态变更入参
     * @param {*} inparam 
     */
    checkStatus(inparam) {
        let [checkAttError, errorParams] = athena.Util.checkProperties([
            { name: "companyName", type: "REG", min: null, max: null, equal: athena.RegEnum.COMPANYNAME },
            { name: "companyId", type: "S", min: 36, max: 36 },
            { name: "status", type: "N", min: 0, max: 1 }]
            , inparam)
        return [checkAttError, errorParams]
    }
}