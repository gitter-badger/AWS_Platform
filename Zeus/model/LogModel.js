import { Tables, Store$, Codes, BizErr, Empty, Model, Keys, Pick, Omit, StatusEnum, RoleCodeEnum, RoleModels } from '../lib/all'

import { BaseModel } from './BaseModel'

export class LogModel extends BaseModel {
    constructor() {
        super()
        // 设置表名
        this.params = {
            TableName: Tables.ZeusPlatformLog
        }
        // 设置对象属性
        this.item = {
            ...this.baseitem,
            sn: Model.uuid(),
            userId: Model.StringValue
        }
    }
    /**
     * 添加操作日志
     * @param {*} inparam 
     * @param {*} error 
     * @param {*} result 
     */
    addOperate(inparam, error, result) {
        let userId = inparam.operateToken.userId
        let role = inparam.operateToken.role
        let suffix = inparam.operateToken.suffix
        let username = inparam.operateToken.username
        let lastIP = inparam.lastIP
        let type = 'operate'
        let action = inparam.operateAction
        let inparams = inparam
        let ret = 'Y'
        let detail = result
        let level = parseInt(inparam.operateToken.level)
        let levelIndex = inparam.operateToken.levelIndex
        if (error) {
            ret = 'N'
            detail = error
        }
        this.putItem({
            ...this.item,
            userId: userId,
            role: role,
            suffix: suffix,
            level: level,
            levelIndex: levelIndex,
            username: username,
            lastIP: lastIP,
            type: type,
            action: action,
            inparams: inparams,
            ret: ret,
            detail: detail
        }).then((res) => {
        }).catch((err) => {
            console.error(err)
        })
    }

    /**
     * 添加登录日志
     * @param {*} loginUserRet 
     */
    addLogin(userLoginInfo, loginUserErr, loginUserRet) {
        let detail = '登录成功'
        let userId = loginUserRet.userId ? loginUserRet.userId : '0'
        let role = loginUserRet.role
        let suffix = loginUserRet.suffix
        let username = loginUserRet.username
        let lastIP = loginUserRet.lastIP
        let lastLogin = new Date().getTime()
        let userStatus = StatusEnum.Enable
        let parent = loginUserRet.parent ? loginUserRet.parent : '0'
        let level = parseInt(loginUserRet.level)
        let ret = 'Y'
        if (!level && level != 0) {
            level = '-1'
        }
        let levelIndex = loginUserRet.levelIndex
        if (!levelIndex && levelIndex != 0) {
            levelIndex = '-1'
        }

        if (loginUserErr) {
            ret = 'N'
            detail = '登录失败'
            role = userLoginInfo.role
            suffix = userLoginInfo.suffix ? userLoginInfo.suffix : 'Platform'
            username = userLoginInfo.username
            lastIP = userLoginInfo.lastIP
            lastLogin = new Date().getTime()
            if (loginUserErr.code == Codes.CaptchaErr) {
                detail = '验证码输入错误'
            }
            if (loginUserErr.code == Codes.UserNotFound) {
                detail = '用户未找到'
            }
            if (loginUserErr.code == Codes.PasswordError) {
                detail = '密码输入错误'
            }
            if (loginUserErr.code == Codes.MerchantPeriodStartErr) {
                detail = '帐号尚未生效'
            }
            if (loginUserErr.code == Codes.UserIPError) {
                detail = 'IP不合法'
            }
            if (loginUserErr.code == Codes.MerchantPeriodEndErr) {
                detail = '帐号已过期'
                userStatus = StatusEnum.Disable
            }
            if (loginUserErr.code == Codes.UserLocked) {
                detail = '帐号锁定'
                userStatus = StatusEnum.Disable
            }
        }
        this.putItem({
            ...this.item,
            parent: parent,
            userId: userId,
            role: role,
            suffix: suffix,
            level: level,
            levelIndex: levelIndex,
            username: username,
            displayName: loginUserRet.displayName,
            type: 'login',
            lastIP: lastIP,
            lastLogin: lastLogin,
            userStatus: userStatus,
            detail: detail,
            ret: ret
        }).then((res) => {
        }).catch((err) => {
            console.error(err)
        })
    }
}
