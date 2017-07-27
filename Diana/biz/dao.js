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

