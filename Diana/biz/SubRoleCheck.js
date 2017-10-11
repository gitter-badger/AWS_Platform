import { Codes, Model, RoleCodeEnum, SubRoleStatusEnum } from '../lib/all'
const athena = require("../lib/athena")
export class SubRoleCheck {
    /**
     * 检查子角色数据
     */
    checkSubRole(inparam) {
        let [checkAttError, errorParams] = athena.Util.checkProperties([
            { name: "name", type: "REG", min: null, max: null, equal: athena.RegEnum.COMPANYNAME }
        ], inparam)

        // 检查子对象
        if (!inparam.permissions || inparam.permissions.length == 0) {
            throw { "code": -1, "msg": "角色权限不能为空", "params": ["permissions"] }
        }
        if(!inparam.permissions[0].code || !inparam.permissions[0].name){
            throw { "code": -1, "msg": "角色权限内容不完整", "params": ["permissions"] }
        }

        if (checkAttError) {
            Object.assign(checkAttError, { params: errorParams })
            throw checkAttError
        }

        // 数据类型处理

        return [checkAttError, errorParams]
    }
}