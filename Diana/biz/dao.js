import {
  Tables,
  Store$,
  Codes,
  BizErr,
  RoleCodeEnum,
  MSNStatusEnum,
  RoleModels,
  GameTypeEnum,
  Trim,
  Empty,
  Model,
  BillModel,
  BillActionEnum,
  Keys,
  Pick,
  Omit
} from '../lib/all'
import _ from 'lodash'

export const TheAdmin = async (token) =>{
  return await GetUser(token.userId,token.role)
}
export const ListAllAdmins = async (token) => {
  if (token.role !== RoleCodeEnum['PlatformAdmin']) {
    return [BizErr.TokenErr('must admin role'),0]
  }
  const query = {
    TableName: Tables.ZeusPlatformUser,
    KeyConditionExpression: '#role = :role',
    ExpressionAttributeNames:{
      '#role':'role'
    },
    ExpressionAttributeValues: {
      ':role':RoleCodeEnum['PlatformAdmin']
    }
  }
  const [queryErr,adminRet] = await Store$('query',query)
  if (queryErr) {
    return [queryErr,0]
  }
  return [0,adminRet.Items]
}
export const ListChildUsers = async (token,roleCode) => {
  var parentId = token.userId
  var query = {
    TableName: Tables.ZeusPlatformUser,
    IndexName: 'RoleParentIndex',
    KeyConditionExpression: '#role = :role and parent = :parent',
    ExpressionAttributeNames:{
      '#role':'role'
    },
    ExpressionAttributeValues:{
      ':parent':parentId,
      ':role':roleCode
    }
  }
  if (RoleCodeEnum['PlatformAdmin'] === token.role) {
    query = {
      TableName: Tables.ZeusPlatformUser,
      IndexName: 'RoleParentIndex',
      KeyConditionExpression: '#role = :role',
      ExpressionAttributeNames:{
        '#role':'role'
      },
      ExpressionAttributeValues:{
        ':role':roleCode
      }
    }
  }

  const [queryErr,queryRet] = await Store$('query',query)
  if (queryErr) {
    return [queryErr,0]
  }
  const users = _.map(queryRet.Items,(item)=>{
    return Omit(item,['passhash'])
  })
  return [0,users]
}

export const ListAvalibleManagers = async() =>{
  const query = {
    TableName: Tables.ZeusPlatformUser,
    IndexName: 'RoleSuffixIndex',
    KeyConditionExpression: '#role = :role',
    ExpressionAttributeNames:{
      '#role':'role'
    },
    ExpressionAttributeValues:{
      ':role':RoleCodeEnum['Manager']
    }
  }
  const [queryErr,queryRet] = await Store$('query',query)
  if (queryErr) {
    return [queryErr,0]
  }
  const viewList = _.map(queryRet.Items,(item)=>{
    return {
      value:item.userId,
      label:item.suffix
    }
  })
  return [0,viewList]

}

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


export const UserUpdate = async(userData)=>{
  const User = {
    ...userData,
    updatedAt:Model.timeStamp()
  }
  const put = {
    TableName: Tables.ZeusPlatformUser,
    Item:User
  }
  const [err,updateRet] = await Store$('put',put)
  if (err) {
    return [err,0]
  }
  return [0,updateRet]
}
const getUserByName = async(role, username) => {
  const query = {
    TableName: Tables.ZeusPlatformUser,
    IndexName: 'RoleUsernameIndex',
    KeyConditionExpression: '#role = :role and #username = :username',
    ExpressionAttributeNames:{
      '#username':'username',
      '#role':'role'
    },
    ExpressionAttributeValues:{
      ':username':username,
      ':role':role
    }
  }
  const [queryErr,queryRet] = await Store$('query',query)
  if (queryErr) {
    return [queryErr,0]
  }
  const User = queryRet.Items[0]
  if (!User) {
    return [BizErr.UserNotFoundErr(),0]
  }
  return [0,User]
}

export const QueryUserById = async (userId) => {
  const query = {
    TableName: Tables.ZeusPlatformUser,
    IndexName: 'UserIdIndex',
    KeyConditionExpression: 'userId = :userId',
    ExpressionAttributeValues:{
      ':userId': userId
    }
  }
  const [err,querySet] = await  Store$('query',query)
  if (err) {
    return [err,0]
  }
  if (querySet.Items.length - 1 != 0) {
    return [BizErr.UserNotFoundErr(),0]
  }

  return [0,querySet.Items[0]]
}
export const GetUser = async (userId,role) => {
  const query = {
    TableName: Tables.ZeusPlatformUser,
    KeyConditionExpression: '#userId = :userId and #role = :role',
    ExpressionAttributeValues:{
      ':role':role,
      ':userId':userId
    },
    ExpressionAttributeNames:{
      '#userId':'userId',
      '#role':'role'
    }
  }

  const [queryErr,queryRet] = await Store$('query',query)
  if (queryErr) {
    return [queryErr,0]
  }
  if (queryRet.Items.length - 1 != 0) {
    return [BizErr.UserNotFoundErr(),0]
  }
  const User = queryRet.Items[0]
  return [0,User]
}
const getUserById = async (userId,role) => {
  const get = {
    TableName: Tables.ZeusPlatformUser,
    Key: {
      role: role,
      userId: userId
    }
  }
  const [getErr,getRet] = await Store$('get',get)
  if (getErr) {
    return [getErr,0]
  }
  const User = getRet.Item
  if (!User) {
    return [BizErr.UserNotFoundErr(),0]
  }
  return [0,User]
}
export const FormatMSN = function(param) {
  try {
    if (isNaN(parseFloat(param.msn)) || 1000.0 - parseFloat(param.msn) >= 1000.0 || 1000.0 - parseFloat(param.msn) <= 0 ) {
      return [BizErr.ParamErr('msn is [1,999]')]
    }
    const formatedMsn = ((parseFloat(param.msn) * 0.001).toFixed(3) + '').substring(2)
    return [0,formatedMsn]
  } catch (e) {
    return [BizErr.ParamErr(e.toString()),0]
  }
}
export const CheckMSN = async(param) =>{
  // get a number from event
  // const [formatErr,msn] = FormatMSN(param)
  // if (formatErr) {
  //   return [formatErr,0]
  // }
  const query = {
    TableName: Tables.ZeusPlatformMSN,
    KeyConditionExpression: '#msn = :msn',
    FilterExpression: '#status = :usedStatus or #status = :lockStatus',
    ExpressionAttributeNames:{
      '#msn':'msn',
      '#status':'status'
    },
    ExpressionAttributeValues:{
      ':msn': param.msn.toString(),
      ':usedStatus': MSNStatusEnum['Used'],
      ':lockStatus': MSNStatusEnum['Locked']
    }
  }
  
  const [queryErr,queryRet] = await Store$('query',query)

  if (queryErr) {
    return [queryErr,0]
  }
  return [0,(queryRet.Items.length == 0)]
}

