import {
  Tables,
  Store$,
  Codes,
  BizErr,
  RoleCodeEnum,
  RoleModels,
  GameTypeEnum,
  Trim,
  Empty,
  Model,
  Keys,
  Pick,
  Omit
} from '../lib/all'
import _ from 'lodash'

/**
 * 添加游戏
 * @param {*} gameInfo 
 */
export const AddGame = async(gameInfo) => {
  const gameName = gameInfo.gameName
  const gameType = gameInfo.gameType
  const kindId = parseInt(gameInfo.kindId)

  if (!GameTypeEnum[gameType]) {
    return [BizErr.ParamErr('Game type not exist'),0]
  }
  if (Trim(gameName).length < 1) {
    return [BizErr.ParamErr('Need a game name'),0]
  }
  if (!_.isNumber(kindId)) {
    return [BizErr.ParamErr('kindId should provided and kindId cant parse to number')]
  }
  const query = {
    TableName: Tables.ZeusPlatformGame,
    IndexName: 'GameNameIndex',
    KeyConditionExpression:'gameType = :gameType and gameName = :gameName',
    ExpressionAttributeValues:{
      ':gameName':gameName,
      ':gameType':gameType
    }
  }
  const [queryErr,queryRet] = await Store$('query',query)
  if (queryErr) {
    return [queryErr,0]
  }
  if (queryRet.Items.length > 0) {
    return [BizErr.ItemExistErr(),0]
  }
  const Game = {
    ...Model.baseModel(),
    ...gameInfo,
    gameId: Model.uuid()
  }
  const put = {
    TableName: Tables.ZeusPlatformGame,
    Item:Game
  }
  const [putErr,putRet] = await Store$('put',put)
  if (putErr) {
    return [putErr,0]
  }
  return [0,putRet]
}

/**
 * 游戏列表
 * @param {*} pathParams 
 */
export const ListGames = async(pathParams)=>{
  if (Empty(pathParams)) {
    return [BizErr.ParamMissErr(),0]
  }
  const inputTypes = pathParams.gameType.split(',')
  const gameTypes = _.filter(inputTypes,(type)=>{
    return !!GameTypeEnum[type]
  })
  if (gameTypes.length === 0) {
    return [BizErr.ParamErr('game type is missing'),0]
  }
  const ranges = _.map(gameTypes,(t,index)=>{
    return `gameType = :t${index}`
  }).join(' OR ')
  const values = _.reduce(gameTypes,(result,t,index)=>{
    result[`:t${index}`] = t
    return result
  },{})
  const scan = {
    TableName: Tables.ZeusPlatformGame,
    IndexName: 'GameTypeIndex',
    FilterExpression:ranges,
    ExpressionAttributeValues:values
  }
  const [err,ret] = await Store$('scan',scan)
  if (err) {
    return [err,0]
  }
  return [0,ret]
}

