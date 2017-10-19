import { Codes, Model, RoleCodeEnum, SubRoleStatusEnum } from '../lib/all'
const athena = require("../lib/athena")
export class SubRoleCheck {
    /**
     * 检查子角色数据
     */
    checkSubRole(inparam) {
        let [checkAttError, errorParams] = athena.Util.checkProperties([
            { name: "name", type: "REG", min: null, max: null, equal: athena.RegEnum.COMPANYNAME },
            { name: "remark", type: "NS", min: 1, max: 200 }
        ], inparam)

        // 检查子对象
        if (!inparam.permissions || inparam.permissions.length == 0) {
            throw { "code": -1, "msg": "角色权限不能为空", "params": ["permissions"] }
        }

        // 数据过滤
        for (let i in inparam.permissions) {
            if (inparam.permissions[i] == '所有权限') {
                inparam.permissions.splice(i, 1)
                break
            }
        }

        if (checkAttError) {
            Object.assign(checkAttError, { params: errorParams })
            throw checkAttError
        }

        // 数据类型处理

        return [checkAttError, errorParams]
    }
}