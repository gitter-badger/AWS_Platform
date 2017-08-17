import {Util} from "./lib/athena";

import {CODES, CHeraErr} from "./biz/Codes"

import {ReHandler, JwtVerify} from "./lib/Response";

import athena from "./lib/athena"

import {PlatformUserModel} from "./model/PlatformUserModel"

import {PlatformBillModel} from "./model/PlatformBillModel"

import {RoleCodeEnum} from "./lib/Consts";

import {TimeUtil}  from "./lib/TimeUtil"

/**
 * 系统总看板
 * @param {*} event 
 * @param {*} context 
 * @param {*} callback 
 */
const sumBoard = async function(event, context, callback) {
  //检查参数是否合法
  let [checkAttError, errorParams] = athena.Util.checkProperties([
    {name : "date", type:"N"},
    {name : "type", type:"N"},  //1今日售出点数   2，代理已消耗点数  3，玩家总数  4，游戏下载次数
  ], requestParams);
  let {date, type} = requestParams;
  switch(type) {
      case 1 : {
        //获取当天的售出点数
        let [currErr, sum] = await soldPointsByDate(date);
        if(currErr) {
            errorHandle(callback, ReHandler.fail(checkAttError));
        }
        let preDate = new Date(date);
        preDate.setDate(preDate.getDate()-7);
        let [preErr, preSum] = await soldPointsByDate(preDate);
        return callback(null, ReHandler.success({currSum: sum, preSum}));
      }
      case 2 : {

      }
      case 3 : {  //玩家总数
        
      }
      case 4 : {

      }
      default : {

      }
  }
}
/**
 * 售出点数
 */
async function soldPointsByDate(date){
    let billModel = new PlatformBillModel();
    let d = new Date(date);
    let firstTime = TimeUtil.getDayFirstTime(date);
    let endTime = TimeUtil.getDayEndTime(date);
    let [dayError, array] = billModel.statistics(null, firstTime, endTime);
    if(dayError) {
        return [dayError, 0]
    }
    let sum = 0;
    array.forEach(function(element) {
        sum -= element.amount;
    }, this);
    return [null, sum];
}

/**
 * 错误处理
 */
const errorHandle = (cb, error) =>{
  let errObj = {};
    errObj.err = error;
    errObj.code = error.code;
    cb(null, ReHandler.fail(errObj));
}

export{
    sumBoard //总看板
}
