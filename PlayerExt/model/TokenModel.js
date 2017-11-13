let {RoleCodeEnum} = require("../lib/Consts");


import {BaseModel} from "../lib/athena"

import {CODES, CHeraErr} from "../lib/Codes"

import {
    Tables,
} from '../lib/all'



export class TokenModel extends BaseModel{
    constructor({iat,userId} = {}) {
        super(Tables.SYSToken);
        this.iat = iat;
        this.userId = userId;
    }
    /**
     * 检查TOKEN是否过期，未过期自动更新过期时间
     * @param {*} inparam 
     */
    async checkExpire(inparam) {
        // 判断TOKEN是否太老（大于24小时）
        if (Math.floor((new Date().getTime() / 1000)) - inparam.iat > 86400) {
            return [new CHeraErr(CODES.TokenError), 0]
        }
        let [err, userToken] = await this.get({userId:inparam.userId});
        if (err) {
            return [err, 0]
        }
        if(!userToken) {
            return [new CHeraErr(CODES.TokenError), 0]
        }
        // 超过30分钟过期
        if (Math.floor((new Date().getTime() / 1000)) - userToken.iat > 7200) {
            return [new CHeraErr(CODES.TokenError), 0]
        }else { // 更新过期时间
            this.iat = Math.floor(Date.now() / 1000) - 30;
            let [saveErr] = await this.save();
            if(saveErr) {
                return [saveErr, null];
            }
            return [0, 0]
        }
    }
       
}
