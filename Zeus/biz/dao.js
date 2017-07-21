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
export const ListChildUsers = async (token,roleCode) => {
  var parentId = token.userId
  if (RoleCodeEnum['PlatformAdmin'] === token.role) {
      parentId = Model.DefaultParent
  }
  const query = {
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

export const ManagerById = async(id)=>{
  return  await getUserById(id,RoleCodeEnum['Manager'])
}

export const MerchantById = async(id)=>{
  return await getUserById(id,RoleCodeEnum['Merchant'])
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


export const CheckRoleFromToken  = (token,userInfo) => {
  if (RoleCodeEnum['Merchant'] === token.role){
    // 登录角色为商户角色,不可以创建任何其他角色
    return [BizErr.TokenErr('Operation not allowd. merchant role cant create user'),0]
  }
  if (RoleCodeEnum['PlatformAdmin'] === token.role) {
    //登录角色为平台管理员, 可以创建管理员, 线路商,商户
    if (!(
      RoleCodeEnum['PlatformAdmin'] === userInfo.role ||
      RoleCodeEnum['Manager'] === userInfo.role ||
      RoleCodeEnum['Merchant'] === userInfo.role
    )) {
      return [BizErr.TokenErr('Operation not Allowed. PlatformAdmin can only create PlatformAdmin,mananger, merchant')]
    }
  }
  if (RoleCodeEnum['Manager'] === token.role) {
    if(
      !(RoleCodeEnum['Manager'] === userInfo.role || RoleCodeEnum['Merchant'] === userInfo.role)
    ){
      return [BizErr.TokenErr('Operation not allowed. Manager can only create manager , merchant'),0]
    }
  }

  return [0,userInfo]
}
export const GetUser = async (userId,role,parent) => {


  const query = {
    TableName: Tables.ZeusPlatformUser,
    KeyConditionExpression: '#userId = :userId and #role = :role',
    FilterExpression:'#parent = :parent',
    ExpressionAttributeValues:{
      ':parent':parent,
      ':role':role,
      ':userId':userId
    },
    ExpressionAttributeNames:{
      '#parent':'parent',
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
// 存入
export const DepositTo = async(fromUser,billInfo) => {
  const userId = fromUser.userId
  const role = fromUser.role
  return await BillTransfer(userId,role,billInfo,BillActionEnum.Deposit)
}
// 提出
export const WithdrawFrom = async(fromUser,billInfo) => {
  const userId = fromUser.userId
  const role = fromUser.role
  return await BillTransfer(userId,role,billInfo,BillActionEnum.Withdraw)
}

const BillTransfer = async(userId,role,billInfo,action) => {
  if (Empty(billInfo)) {
    return [BizErr.ParamMissErr(),0]
  }
    // move out user input sn
  billInfo = Omit(billInfo,['sn','fromRole','fromUser','action'])
console.log('billInfo',billInfo);
  const [toUserErr,toUser] = await getUserByName(billInfo.toRole,billInfo.toUser)
  if (toUserErr) {
    return [toUserErr,0]
  }
  const toUserId = toUser.userId

  const [userErr,User] = await getUserById(userId,role)
  if (userErr) {
    return [userErr,0]
  }

  const Role = RoleModels[role]()
  if (!Role || Role.points === undefined) {
    return [BizErr.ParamErr('role error'),0]
  }
  const UserProps = Pick({
    ...Role,
    ...User
  },Keys(Role))

  const initPoints = UserProps.points
  const fromUser = UserProps.username
  const fromRole = UserProps.role

  if (!fromRole || !fromUser ) {
    return [BizErr.ParamErr('Param error,invalid transfer. from** null')]
  }
  if (fromUser == billInfo.toUser) {
    return [BizErr.ParamErr('Param error,invalid transfer. self transfer not allowed')]
  }



  const Bill = {
    ...Model.baseModel(),
    ...Pick({
      ...BillModel(),
      ...billInfo,
      fromUser:fromUser,
      fromRole:fromRole,
      action:action
    },Keys(BillModel()))
  }


  const batch = {
    RequestItems: {
      'ZeusPlatformBill':[
        {
          PutRequest:{
            Item: {
              ...Bill,
              amount: Bill.amount * action,
              action: action,
              userId:userId
            }
          }
        },
        {
          PutRequest:{
            Item: {
              ...Bill,
              amount: (-1.0) * Bill.amount * action,
              action: (-1.0) * action,
              userId: toUserId
            }
          }
        }
      ]
    }
  }
  const [err,ret] = await Store$('batchWrite',batch)
  if (err) {
    return [err,0]
  }
  return [0,Bill]
}

export const CheckBalance = async (token,userId) =>{
  return [0,1000000.00]
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
  const [formatErr,
    msn] = FormatMSN(param)
  if (formatErr) {
    return [formatErr,0]
  }
  const query = {
    TableName: Tables.ZeusPlatformMSN,
    KeyConditionExpression: '#msn = :msn',
    FilterExpression: '#status = :usedStatus or #status = :lockStatus',
    ExpressionAttributeNames:{
      '#status':'status',
      '#msn':'msn'
    },
    ExpressionAttributeValues:{
      ':msn':msn,
      ':usedStatus':MSNStatusEnum['Used'],
      ':lockStatus':MSNStatusEnum['Locked']
    }
  }
  const [queryErr,queryRet] = await Store$('query',query)

  if (queryErr) {
    return [queryErr,0]
  }
  return [0,(queryRet.Items.length == 0)]
}
