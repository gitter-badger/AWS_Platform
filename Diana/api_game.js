import {
  Success,
  Fail,
  Codes,
  JSONParser,
  Model,
  Tables,
  GameTypeEnum,
  StatusEnum,
  GenderEnum,
  RoleCodeEnum,
  RoleEditProps,
  Trim,
  Pick,
  JwtVerify,
  GeneratePolicyDocument,
  BizErr
} from './lib/all'
import { GameModel } from './model/GameModel'
import { LogModel } from './model/LogModel'
import { UserModel } from './model/UserModel'

import { GameCheck } from './biz/GameCheck'

const ResOK = (callback, res) => callback(null, Success(res))
const ResFail = (callback, res, code = Codes.Error) => callback(null, Fail(res, code))
const ResErr = (callback, err) => ResFail(callback, { err: err }, err.code)

/**
 * 创建游戏
 */
const gameNew = async (e, c, cb) => {
  // 入参转换
  const errRes = { m: 'gameNew err'/*, input: e*/ }
  const res = { m: 'gameNew' }
  const [jsonParseErr, gameInfo] = JSONParser(e && e.body)
  if (jsonParseErr) {
    return ResErr(cb, jsonParseErr)
  }
  //检查参数是否合法
  let [checkAttError, errorParams] = new GameCheck().checkGame(gameInfo)
  if (checkAttError) {
    Object.assign(checkAttError, { params: errorParams })
    return ResErr(cb, checkAttError)
  }
  // 获取令牌，只有管理员有权限
  const [tokenErr, token] = await Model.currentRoleToken(e, RoleCodeEnum['PlatformAdmin'])
  if (tokenErr) {
    return ResErr(cb, tokenErr)
  }

  // 业务操作
  const [addGameInfoErr, addGameRet] = await new GameModel().addGame(gameInfo)

  // 操作日志记录
  gameInfo.operateAction = '创建游戏'
  gameInfo.operateToken = token
  new LogModel().addOperate(gameInfo, addGameInfoErr, addGameRet)

  if (addGameInfoErr) {
    return ResFail(cb, { ...errRes, err: addGameInfoErr }, addGameInfoErr.code)
  }
  return ResOK(cb, { ...res, payload: addGameRet })
}

/**
 * 游戏列表
 */
const gameList = async (e, c, cb) => {
  const errRes = { m: 'gamelist err'/*, input: e*/ }
  const res = { m: 'gamelist' }
  // const [paramsErr, gameParams] = Model.pathParams(e)
  // if (paramsErr) {
  //   return ResErr(cb, jsonParseErr)
  // }
  const [jsonParseErr, gameParams] = JSONParser(e && e.body)
  if (jsonParseErr) {
    return ResErr(cb, jsonParseErr)
  }
  let [err, ret] = [1, 1]
  if (!gameParams.parent || gameParams.parent == RoleCodeEnum['PlatformAdmin'] || gameParams.parent == '01') {
    [err, ret] = await new GameModel().listGames(gameParams)
  } else {
    [err, ret] = await new UserModel().queryUserById(gameParams.parent)
  }
  if (err) {
    return ResFail(cb, { ...errRes, err: err }, err.code)
  }
  if (gameParams.parent) {
    ret = ret.gameList
  }
  return ResOK(cb, { ...res, payload: ret })
}

/**
 * 单个游戏
 */
const gameOne = async (e, c, cb) => {
  const errRes = { m: 'gameOne err'/*, input: e*/ }
  const res = { m: 'gameOne' }
  const [paramsErr, gameParams] = Model.pathParams(e)
  if (paramsErr) {
    return ResErr(cb, jsonParseErr)
  }
  let [err, ret] = await new GameModel().getOne(gameParams.gameType, gameParams.gameId)
  if (err) {
    return ResFail(cb, { ...errRes, err: err }, err.code)
  }
  return ResOK(cb, { ...res, payload: ret })
}

/**
 * 游戏状态变更，接口编号：
 */
const gameChangeStatus = async (e, c, cb) => {
  // 数据输入，转换，校验
  const errRes = { m: 'gameChangeStatus error' }
  const res = { m: 'gameChangeStatus' }
  const [jsonParseErr, inparam] = JSONParser(e && e.body)
  if (jsonParseErr) {
    return ResErr(cb, jsonParseErr)
  }
  //检查参数是否合法
  let [checkAttError, errorParams] = new GameCheck().checkGame(inparam)
  if (checkAttError) {
    Object.assign(checkAttError, { params: errorParams })
    return ResErr(cb, checkAttError)
  }
  // 获取令牌，只有管理员有权限
  const [tokenErr, token] = await Model.currentRoleToken(e, RoleCodeEnum['PlatformAdmin'])
  if (tokenErr) {
    return ResErr(cb, tokenErr)
  }
  // 业务操作
  const [err, ret] = await new GameModel().changeStatus(inparam.gameType, inparam.gameId, inparam.status)
  if (err) {
    return ResFail(cb, { ...errRes, err: err }, err.code)
  } else {
    return ResOK(cb, { ...res, payload: ret })
  }
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
  const [err, userInfo] = await JwtVerify(token[1])
  if (err || !userInfo) {
    console.log(JSON.stringify(err), JSON.stringify(userInfo));
    return c.fail('Unauthorized')
  }
  console.info(userInfo)
  return c.succeed(GeneratePolicyDocument(userInfo.userId, 'Allow', e.methodArn, userInfo))

}

/**
  api export
**/
export {
  jwtverify,                    // 用于进行token验证的方法

  gameNew,                      // 新建游戏
  gameList,                     // 游戏列表
  gameChangeStatus,             // 游戏状态变更
  gameOne                       // 单个游戏
}