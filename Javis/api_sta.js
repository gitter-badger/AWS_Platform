import {Util} from "./lib/athena";

import { BizErr,Codes } from './lib/Codes'

import {Success, Fail} from "./lib/Response";

import {PlatformUserModel} from "./model/PlatformUserModel"

import {PlatformBillModel} from "./model/PlatformBillModel"

import {RoleCodeEnum} from "./lib/Consts";

const Utils = {
    getweekFirstTime : function(date){
        if(!date) {
            date = new Date();
        }
        let day = date.getDay();
        date.setDate(date.getDate() - day);
        this.setFirst(date);
        return date.getTime();
    },
    getWeekEndTime : function(date){
        if(!date) {
            date = new Date();
        }
        let day = date.getDay();
        date.setDate(date.getDate()+6-day);
        this.setEnd(date);
        return date.getTime();
    },
    getMonthFirstTime : function(date){
        if(!date) {
            date = new Date();
        }
        let day = date.getDate();
        date.setDate(date.getDate() - day);
        this.setFirst(date);
        return date.getTime();
    },
    getMonthEndTime : function(){
        let date = new Date();
        let day = date.getDate();
        date.setDate(date.getDate() - day);
        this.setEnd(date);
        return date.getTime();
    },
    setFirst(date){
        date.setHours(0);
        date.setMinutes(0);
        date.setSeconds(0);
        date.setMilliseconds(0);
    },
    setEnd(date){
        date.setHours(23);
        date.setMinutes(59);
        date.setSeconds(59);
        date.setMilliseconds(999);
    },
    formatDay(date){
        return this.toNumberTwo(date.getMonth()+1) + "-"+ this.toNumberTwo(date.getDate());
    },
    toNumberTwo(number){
        return number > 9 ? number+"" : "0"+number
    }
}

/**
 
 * @param {*} event 
 * @param {*} context 
 * @param {*} cb 
 */
const overview = async (event, context, cb) => {
  //json转换
  let [parserErr, requestParams] = Util.parseJSON(event.queryStringParameters);
  if(parserErr) return callback(null, Fail(parserErr));
  let type = requestParams.type ? +requestParams.type :1; //1,线路商数量 2,售出点数 3，成交量 4,累计收益
  let userModel = new PlatformUserModel();
  let billModel = new PlatformBillModel();
  let error, sumInfo =0, array;
  if(type ==1) {
    [error, sumInfo] = await userModel.lineMerchantCount();
  }else { //售出点数 
    [error, array] = await billModel.statistics(type);
    for(let i =0; i < array.length; i++){
        sumInfo += array[i].num;
    }
  }
  if(error) {
    return cb(null, Fail(error));
  }
  cb(null, Success({data: {num:sumInfo}}));

}



/**
 * 本周，本月销售统计
 * @param {*} event 
 * @param {*} context 
 * @param {*} cb 
 * @param type 1 本周 2本月
 */
const salePointsInfo = async (event, context, cb) => {

  //json转换
  let [parserErr, requestParams] = Util.parseJSON(event.queryStringParameters);
  if(parserErr){
       return callback(null, Fail(parserErr));
  }
  let type = +requestParams.type || 2;
  let mode = +requestParams.mode || 1;
  let billModel = new PlatformBillModel();
  let firstTime = 0, endTime = 0, preFirstTime = 0, preEndTime = 0;
  if(mode == 1) { //本周
    firstTime = Utils.getweekFirstTime();
    endTime = Utils.getWeekEndTime();
    let date1 = new Date(firstTime);
    let date2 = new Date(endTime);
    date1.setDate(date1.getDate()-7);
    date2.setDate(date2.getDate()-7);
    preFirstTime = date1.getTime();
    preEndTime = date2.getTime();
  } else { //本月
    firstTime = Utils.getMonthFirstTime();
    endTime = Utils.getMonthEndTime();
  }

  let [error, currentList] = await billModel.statistics(type, firstTime, endTime);  
  let [err, preList] = await billModel.statistics(type, preFirstTime, preEndTime);  
  if(error || err) {
        return cb(null, Fail(error));
  }
  let currentNumber =0, preNumber = 0;
  currentList.forEach(function(element) {
      currentNumber += element.num;
  }, this);
  preList.forEach(function(element){
      preNumber += element.num;
  })
  cb(null, Success({currNumber:currentNumber, preNumber:preNumber}));
}

/**
 * 统计详情
 * @param {*} event 
 * @param {*} context 
 * @param {*} cb 
 */
const statisticsDetail = async (event, context, cb) => {
    //json转换
  let [parserErr, requestParams] = Util.parseJSON(event.queryStringParameters);
  if(parserErr){
       return callback(null, Fail(parserErr));
  }
  let type = +requestParams.type || 2;
  let startTime = +requestParams.startTime || 0;
  let entTime = +requestParams.endTime || Date.now();
  let billModel = new PlatformBillModel();
  let [error, list] = await billModel.statistics(type, firstTime, endTime);  
  if(error) {
        return cb(null, Fail(error));
  }

  //按天拆分
  let returnObj = {};
  list.forEach((item) => {
    let createdAt = +item.createdAt;
    let timeStr = Utils.formatDay(new Date(createdAt));
    returnObj[timeStr] = returnObj[timeStr] || 0;
    returnObj[timeStr] += item.num;
  })
  cb(null, Success({data:returnObj}));
}



export{
    overview, //总统计
    salePointsInfo, //本周，本月销售统计
}