import { ResOK, ResErr, Codes, JSONParser, Model, RoleCodeEnum, Trim, Pick, BizErr } from './lib/all'
import { UserRankCheck } from './biz/UserRankCheck'
import { UserRankStatModel } from './model/UserRankStatModel'
import { PlayerModel } from './model/PlayerModel'
import { PlayerBillDetailModel } from './model/PlayerBillDetailModel'
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
    return ResOK(cb, {})
  } catch (error) {
    console.error(error)
    return ResErr(cb, error)
  }
}
/**
 * 获取老玩家的下注和返奖金额
 */
const initBetRank = async (e, c, cb) => {
  try {
    //查出所有玩家流水
    const [billErr, billList] = await new PlayerBillDetailModel().scanBillDetail()
    if (billErr) { return ResErr(cb, billErr) }
    let groupResult = _.groupBy(billList, 'userName')
    //写入玩家数据
    for (let userName in groupResult) {
      let bet = 0
      let win = 0
      for (let billItem of groupResult[userName]) {
        if (billItem.type == 3) {
          bet +=parseFloat(Math.abs(billItem.amount)) 
        } else if (billItem.type == 4) {
          win += parseFloat(billItem.amount)
        }
      }
      bet = bet.toFixed(2)
      win = win.toFixed(2)
      new UserRankStatModel().updateBetRank({ userName: userName, bet: bet, win: win })
    }
    return ResOK(cb, {})
  } catch (error) {
    console.error(error)
    return ResErr(cb, error)
  }
}



// ==================== 以下为内部方法 ====================

export {
  userRank,                      //用户排行榜 
  initRank,                      //初始玩家用户名和余额
  initBetRank
}