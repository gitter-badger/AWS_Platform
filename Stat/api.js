
import { TokenModel } from './model/TokenModel'
import { Util } from "./lib/Util"

import {JwtVerify} from "./lib/Response";
// TOKEN验证
const jwtverify = async (e, c, cb) => {
  // get the token from event.authorizationToken
  const token = e.authorizationToken.split(' ')
  if (token[0] !== 'Bearer') {
    return c.fail('Unauthorized: wrong token type')
  }
  // verify it and return the policy statements
  const [err, userInfo] = await JwtVerify(token[1]);
  if (err || !userInfo) {
    console.log(JSON.stringify(err), JSON.stringify(userInfo));
    return c.fail('Unauthorized')
  }


  const [checkErr, checkRet] = await new TokenModel(userInfo).checkExpire(userInfo);
  if (checkErr) {
    return c.fail(checkErr.msg)
  } else {
    // 结果返回
    return c.succeed(Util.generatePolicyDocument(userInfo.userId, 'Allow', e.methodArn, userInfo))
  }
}

export {
  jwtverify                    // 用于进行token验证的方法
}