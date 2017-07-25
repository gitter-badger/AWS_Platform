import {
  Stream$,
  Success,
  Fail,
  Codes,
  JSONParser,
  Model,
  Tables,
  BillActionEnum,
  StatusEnum,
  GenderEnum,
  RoleCodeEnum,
  RoleEditProps,
  Trim,
  Pick,
  JwtVerify,
  GeneratePolicyDocument,
  MSNStatusEnum,
  BizErr
} from './lib/all'
import { RegisterAdmin, RegisterUser, LoginUser, UserGrabToken } from './biz/auth'
import {
  ListAllAdmins,
  ListChildUsers,
  ListAvalibleManagers,
  TheAdmin,
  AddGame,
  ListGames,
  DepositTo,
  WithdrawFrom,
  CheckMSN,
  FormatMSN,
  UserUpdate,
  GetUser,
  QueryUserById,
  QueryBillUser,
  CheckBalance,
  CheckUserBalance,
  ComputeWaterfall

} from './biz/dao'
import { CaptchaModel } from './model/CaptchaModel'
import { MsnModel } from './model/MsnModel'
import { UserModel } from './model/UserModel'
// import { Util } from "athena"

const ResOK = (callback, res) => callback(null, Success(res))
const ResFail = (callback, res, code = Codes.Error) => callback(null, Fail(res, code))
const ResErr = (callback, err) => ResFail(callback, { err: err }, err.code)

/**
 * 例子：查询
 */
const exquery = async (e, c, cb) => {
  // 数据输入，转换，校验
  console.info('test')
}

// ==================== 以下为内部方法 ====================

// TOKEN验证
const jwtverify = async (e, c, cb) => {
  // get the token from event.authorizationToken
  const token = e.authorizationToken.split(' ')
  if (token[0] !== 'Bearer') {
    return c.fail('Unauthorized: wrong token type')
  }
  // verify it and return the policy statements
  const [err,
    userInfo] = await JwtVerify(token[1])
  if (err || !userInfo) {
    console.log(JSON.stringify(err), JSON.stringify(userInfo));
    return c.fail('Unauthorized')
  }

  return c.succeed(GeneratePolicyDocument(userInfo.userId, 'Allow', e.methodArn, userInfo))

}

// 随机数
function randomNum(min, max) {
  var range = max - min
  var rand = Math.random()
  var num = min + Math.round(rand * range)
  return num
}

/**
  api export
**/
export {
  jwtverify,                    // 用于进行token验证的方法
  exquery                          
}
