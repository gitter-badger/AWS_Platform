import { ResOK, ResErr, Codes, JSONParser, Model, GameTypeEnum, RoleCodeEnum, BizErr } from './lib/all'
import { GameModel } from './model/GameModel'
import { LogModel } from './model/LogModel'
import { UserModel } from './model/UserModel'

import { GameCheck } from './biz/GameCheck'

/**
 * 创建游戏
 */
const gameNew = async (e, c, cb) => {
  try {
    // 入参转换
    const [jsonParseErr, gameInfo] = JSONParser(e && e.body)
    //检查参数是否合法
    const [checkAttError, errorParams] = new GameCheck().checkGame(gameInfo)
    // 获取令牌，只有管理员有权限
    const [tokenErr, token] = await Model.currentRoleToken(e, RoleCodeEnum['PlatformAdmin'])

    // 业务操作
    const [addGameInfoErr, addGameRet] = await new GameModel().addGame(gameInfo)

    // 操作日志记录
    gameInfo.operateAction = '创建游戏'
    gameInfo.operateToken = token
    new LogModel().addOperate(gameInfo, addGameInfoErr, addGameRet)
    // 结果返回
    if (addGameInfoErr) { return ResErr(cb, addGameInfoErr) }
    return ResOK(cb, { payload: addGameRet })
  } catch (error) {
    return ResErr(cb, error)
  }
}

/**
 * 游戏列表
 */
const gameList = async (e, c, cb) => {
  try {
    // 身份令牌
    const [tokenErr, token] = await Model.currentToken(e)
    const [jsonParseErr, gameParams] = JSONParser(e && e.body)
    //检查参数是否合法
    const [checkAttError, errorParams] = new GameCheck().checkQuery(gameParams)
    // 普通游戏列表
    let [err, ret] = await new GameModel().listGames(gameParams)
    if (err) { return ResErr(cb, err) }
    return ResOK(cb, { payload: ret })
  } catch (error) {
    console.info(error)
    return ResErr(cb, error)
  }
}

/**
 * 单个游戏
 */
const gameOne = async (e, c, cb) => {
  try {
    // 入参转换
    const [paramsErr, gameParams] = Model.pathParams(e)
    if (paramsErr) { return ResErr(cb, jsonParseErr) }
    // 获取令牌，只有管理员有权限
    const [tokenErr, token] = await Model.currentRoleToken(e, RoleCodeEnum['PlatformAdmin'])
    // 业务操作
    const [err, ret] = await new GameModel().getOne(gameParams.gameType, gameParams.gameId)
    ret.gameType = GameTypeEnum[ret.gameType].name
    // 结果返回
    if (err) { return ResErr(cb, err) }
    return ResOK(cb, { payload: ret })
  } catch (error) {
    return ResErr(cb, error)
  }
}

/**
 * 游戏状态变更，接口编号：
 */
const gameChangeStatus = async (e, c, cb) => {
  try {
    // 数据输入，转换，校验
    const [jsonParseErr, inparam] = JSONParser(e && e.body)
    //检查参数是否合法
    const [checkAttError, errorParams] = new GameCheck().checkStatus(inparam)
    // 获取令牌，只有管理员有权限
    const [tokenErr, token] = await Model.currentRoleToken(e, RoleCodeEnum['PlatformAdmin'])

    // 业务操作
    const [err, ret] = await new GameModel().changeStatus(inparam.gameType, inparam.gameId, inparam.status)

    // 操作日志记录
    inparam.operateAction = '游戏状态变更'
    inparam.operateToken = token
    new LogModel().addOperate(inparam, err, ret)
    // 结果返回
    if (err) { return ResErr(cb, err) }
    return ResOK(cb, { payload: ret })
  } catch (error) {
    return ResErr(cb, error)
  }
}

/**
 * 游戏类别
 */
const gameType = async (e, c, cb) => {
  try {
    const [jsonParseErr, inparam] = JSONParser(e && e.body)
    // 身份令牌
    const [tokenErr, token] = await Model.currentToken(e)
    // 全部游戏类别
    if (!inparam.parent || inparam.parent == RoleCodeEnum['PlatformAdmin'] || inparam.parent == '01') {
      let gameTypeArr = []
      for (let item in GameTypeEnum) {
        gameTypeArr.push(GameTypeEnum[item])
      }
      return ResOK(cb, { payload: gameTypeArr })
    }
    // 上级游戏类别
    const [err, ret] = await new UserModel().queryUserById(inparam.parent)
    // 结果返回
    if (err) { return ResErr(cb, err) }
    ret.gameList = ret.gameList || []
    // 刷新最新游戏类型内容
    let newGameList = []
    for (let item of ret.gameList) {
      newGameList.push(GameTypeEnum[item.code])
    }
    ret.gameList = newGameList
    return ResOK(cb, { payload: ret.gameList })
  } catch (error) {
    return ResErr(cb, error)
  }
}

// ==================== 以下为内部方法 ====================
export {
  gameNew,                      // 新建游戏
  gameList,                     // 游戏列表
  gameChangeStatus,             // 游戏状态变更
  gameOne,                      // 单个游戏
  gameType                      // 游戏类型
}