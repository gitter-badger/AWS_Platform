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
  BillModel,
  BillActionEnum,
  Keys,
  Pick,
  Omit
} from '../lib/all'
import _ from 'lodash'
export const ListChildUsers = async (parentId,roleCode) => {
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
  return [0,queryRet.Items]
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



const getUserById = async (userId,role) => {
  // get points balance of the given userid
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

export const DepositTo = async(token,billInfo) => {
  const userId = token.userId
  const role = token.role
  return await BillTransfer(userId,role,billInfo,BillActionEnum.Deposit)
}
export const WithdrawFrom = async(token,billInfo) => {
  const userId = token.userId
  const role = token.role
  return await BillTransfer(userId,role,billInfo,BillActionEnum.Withdraw)
}

export const BillTransfer = async(userId,role,billInfo,action) => {
  if (Empty(billInfo)) {
    return [BizErr.ParamMissErr(),0]
  }
    // move out user input sn
  billInfo = Omit(billInfo,['sn','fromRole','fromUser','action'])

  const [toUserErr,toUser] = await getUserByName(billInfo.toRole,billInfo.toUser)
  if (toUserErr) {
    return [toUserErr,0]
  }
  const toUserId = toUser.userId

  const [userErr,User] = await getUserById(userId,role)
  if (userErr) {
    return [userErr,0]
  }

  const Role = RoleModels[role]
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
      ...BillModel,
      ...billInfo,
      fromUser:fromUser,
      fromRole:fromRole
    },Keys(BillModel))
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


  // const put = {
  //   TableName: Tables.ZeusPlatformBill,
  //   Item:Bill
  // }
  const [err,ret] = await Store$('batchWrite',batch)
  if (err) {
    return [err,0]
  }
  return [0,Bill]
}
