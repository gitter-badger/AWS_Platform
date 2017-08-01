import bcrypt from "bcryptjs";

import crypto from "crypto";

import jwt from "jsonwebtoken";

const Bluebird = require('bluebird')
const verify = Bluebird.promisify(jwt.verify);

const uid = require('uuid/v4');

require('uuid/v4')

const TOKEN_SECRET = "f78jkf45k5k5_fxfjei11223kjljka77po";

export class Util{
    static hashGen(pass){
        return bcrypt.hashSync(pass,10)
    }
    static sha256(password){
        const sha = crypto.createHash('sha256');
        sha.update(password);
        return sha.digest('hex');
    }
    static createTokenJWT(info){
        return jwt.sign(info,TOKEN_SECRET)
        return JwtSign({
            ...info,
            iat: Math.floor(Date.now() / 1000) - 30
        })
    }
    static  async jwtVerify(token){
        try {
            const decoded = await verify(token, TOKEN_SECRET)
            return [0,decoded]
        } catch (e) {
            return [e, 0]
        }
    }
    static generatePolicyDocument(principalId, effect, resource,userInfo){
        var authResponse = {};
        authResponse.principalId = principalId;
        authResponse.context = {}
        authResponse.context.username = userInfo.username
        authResponse.context.role = userInfo.role
        authResponse.context.userId = userInfo.userId
        authResponse.context.parent = userInfo.parent
        if (effect && resource) {
            var policyDocument = {};
            policyDocument.Version = '2012-10-17'; // default version
            policyDocument.Statement = [];
            var statementOne = {};
            statementOne.Action = 'execute-api:Invoke'; // default action
            statementOne.Effect = effect;
            statementOne.Resource = resource;
            policyDocument.Statement[0] = statementOne;
            authResponse.policyDocument = policyDocument;
        }
        return authResponse;
    }
    /**
     * 获取长度len位的随机Id;
     */
    static userId(len){
        let number = Number.parseInt(Math.random()*Math.pow(10, len));
        if(number > Math.pow(10, len-1) && number < Math.pow(10, len)){
            return number;
        }else {
            return this.userId(len);
        }
    }
    static uuid(){
        return uid();
    }
}