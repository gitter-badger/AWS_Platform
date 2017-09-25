import { ResOK, ResErr, Codes, JSONParser, Model, RoleCodeEnum, Trim, Pick, JwtVerify, GeneratePolicyDocument, BizErr } from './lib/all'
import { TokenModel } from './model/TokenModel'
// ==================== 以下为内部方法 ====================

// TOKEN验证
const jwtverify = async (e, c, cb) => {
  // get the token from event.authorizationToken
  const token = e.authorizationToken.split(' ')
  if (token[0] !== 'Bearer') {
    return c.fail('授权类型错误')
  }
  // verify it and return the policy statements
  const [err, userInfo] = await JwtVerify(token[1])
  if (err || !userInfo) {
    console.error(JSON.stringify(err), JSON.stringify(userInfo))
    return c.fail('未授权')
  }
  // 有效期校验
  const [checkErr, checkRet] = await new TokenModel().checkExpire(userInfo)
  if (checkErr) {
    return c.fail(checkErr.msg)
  }
  // console.info('解密')
  // console.info(Math.floor(new Date().getTime() / 1000))
  // console.info(userInfo.iat)
  // console.info(Math.floor((new Date().getTime() / 1000)) - userInfo.iat)
  // if(new Date().getTime - userInfo.iat > 100000){
  //   return c.fail('Token expire')
  // }
  // TOKEN是否有效校验（判断密码是否一致）
  // if(!userInfo.password){
  //   return c.fail('Token locked')
  // }
  // 结果返回
  return c.succeed(GeneratePolicyDocument(userInfo.userId, 'Allow', e.methodArn, userInfo))
}

export {
  jwtverify                    // 用于进行token验证的方法
}