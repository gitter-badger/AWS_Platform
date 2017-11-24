import { ResOK, ResErr, Codes, JSONParser, Model, RoleCodeEnum, Trim, Pick, BizErr } from './lib/all'
import { UserRankCheck } from './biz/UserRankCheck'
import { UserRankStatModel } from './model/UserRankStatModel'
import { PlayerModel } from './model/PlayerModel'
import { PlayerBillDetailModel } from './model/PlayerBillDetailModel'
import { GamePlayerBillModel } from './model/GamePlayerBillModel'
import _ from 'lodash'
/**
 * 用户排行榜
 */
const userRank = async (e, c, cb) => {
  try {
    // 入参转换
    const [jsonParseErr, inparam] = JSONParser(e && e.body)
    // 检查参数是否合法
    new UserRankCheck().check(inparam)
    // 获取令牌，只有管理员有权限
    // const [tokenErr, token] = await Model.currentRoleToken(e, RoleCodeEnum['PlatformAdmin'])
    // 业务操作
    const [infoErr, queryBalance] = await new UserRankStatModel().scanRank(inparam)
    // 返回结果
    if (infoErr) { return ResErr(cb, infoErr) }
    return ResOK(cb, { list: queryBalance })
  } catch (error) {
    console.error(error)
    return ResErr(cb, error)
  }
}

/**
 * 初始老玩家的余额和用户名
 */
const initRank = async (e, c, cb) => {
  try {
    //查出所有玩家
    const [userErr, userList] = await new PlayerModel().scan({
    })
    if (userErr) { return ResErr(cb, userErr) }
    //写入玩家数据
    for (let i = 0; i < userList.length; i++) {
      if (userList[i].nickname == "NULL!") {
        continue
      }
      new UserRankStatModel().putsRank(userList[i])
    }
    return ResOK(cb, 'OK')
  } catch (error) {
    console.error(error)
    return ResErr(cb, error)
  }
}
/**
 * 以时间为维度获取玩家的下注和返奖金额
 */
const playerBetRank = async (e, c, cb) => {
  try {
    //查出所有玩家
    let start = new Date().getTime()
    const [playerErr, playerRet] = await new UserRankStatModel().scan({
      ProjectionExpression: "userName"
    })
    let start2 = new Date().getTime()
    console.log('查出所有玩家耗时：' + (start2 - start) + '毫秒')
    if (playerErr) return ResErr(cb, playerErr)
    let promiseArr = []

    //获取周一零点零时的时间
    let oneDayTime = 24 * 60 * 60 * 1000
    let day = new Date().getDay() || 7
    let date = new Date()
    date.setHours(0)
    date.setMinutes(0)
    date.setSeconds(0)
    date.setMilliseconds(0)
    let time = date.getTime()
    let nowTime = new Date().getTime()
    let mondayTime = time - (day - 1) * oneDayTime

    for (let item of playerRet.Items) {
      let p = new GamePlayerBillModel().scanPlayerBill({ userName: item.userName, nowTime: nowTime, mondayTime: mondayTime })
      promiseArr.push(p)
    }
    let start3 = new Date().getTime()
    console.log('for循序分发promise耗时：' + (start3 - start2) + '毫秒')
    Promise.all(promiseArr).then((res) => {
      let start4 = new Date().getTime()
      console.log('总共耗时：' + (start4 - start) + '毫秒')
    }).catch((err) => {
      console.error(err)
    })

    return ResOK(cb, 'OK')
  } catch (error) {
    console.log(error)
    return ResErr(cb, error)
  }
}


/**
 * 获取老玩家的所有下注和返奖金额
 */
const initBetRank = async (e, c, cb) => {
  try {
    //查出所有玩家流水
    let start = new Date().getTime()
    const [billErr, billList] = await new PlayerBillDetailModel().scanBillDetail()
    let start2 = new Date().getTime()
    console.log('查询所有玩家流水耗时：' + (start2 - start) + '毫秒')

    if (billErr) { return ResErr(cb, billErr) }
    let groupResult = _.groupBy(billList, 'userName')
    let start3 = new Date().getTime()
    console.log('分组所有玩家流水耗时：' + (start3 - start2) + '毫秒')

    //写入玩家数据
    for (let userName in groupResult) {
      let bet = Number(0)
      let win = Number(0)
      for (let billItem of groupResult[userName]) {
        if (billItem.type == 3) {
          bet += Math.abs(parseFloat(billItem.amount))
        } else if (billItem.type == 4) {
          win += parseFloat(billItem.amount)
        }
      }
      bet = +bet.toFixed(2)
      win = +win.toFixed(2)
      new UserRankStatModel().updateBetRank({ userName: userName, bet: bet, win: win })
    }
    let start4 = new Date().getTime()
    console.log('更新任务分发结束耗时：' + (start4 - start3) + '毫秒')
    return ResOK(cb, 'OK')
  } catch (error) {
    console.error(error)
    return ResErr(cb, error)
  }
}



// ==================== 以下为内部方法 ====================

export {
  userRank,                      //用户排行榜 
  initRank,                      //初始玩家用户名和余额
  initBetRank,
  playerBetRank
}