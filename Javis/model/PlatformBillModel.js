let  athena  = require("../lib/athena");

import {Tables} from "../lib/Dynamo"
import {RoleCodeEnum, BillActionEnum} from "../lib/Consts";

import {CODES, CHeraErr} from "../lib/Codes";

import {PlatformUserModel} from "./PlatformUserModel"

export class PlatformBillModel extends athena.BaseModel {
    constructor(){
        super(Tables.ZeusPlatformBill);
    }

    /**
     * 
     * @param {*} type 类型 1售出， 2成交量，3累计收益
     * @param {*} beginTime  开始时间 
     * @param {*} endTime  结束时间
     * @param {*} splitTimes  要拆分的时间段
     */
    async statistics(type, beginTime, endTime){
        // 售出， 成交量，累计收益
        let methods = [null,null, sale, volume, profit, list]
        let opts = {
            FilterExpression : "(formRole=:role or formRole=:role2) and toRole=:toRole and #action = :action ",
            ExpressionAttributeNames : {
                "#action" : "action"
            },
            ExpressionAttributeValues : {
                ":role" : RoleCodeEnum.SuperAdmin,
                ":role2" : RoleCodeEnum.Manager,
                ":toRole" : RoleCodeEnum.Agent,
                ":action" : -1
            },
            // AttributesToGet : ["amount","createdAt"],    
        }
        if(beginTime){
            opts.FilterExpression += "and createdAt between :first and :last"
            opts.ExpressionAttributeValues[":first"] = beginTime;
            opts.ExpressionAttributeValues[":last"] = endTime;
        }
        Object.assign(opts, {
            TableName : this.tableName
        })
        return new Promise((reslove, reject) => {
            this.db$("scan",opts).then((result) => {
                let records = result.Items || [];
                //排序
                records.sort((a, b) => {
                    return a.createdAt > b.createdAt
                })
                return reslove( methods[type](records));
            }).catch((err) => {
                return reslove([err, []]);
            })
        })
    }

}

//售出
function sale(array){
    for(let i =0; i < array.length; i++){
        let amount = array[i].amount;
        array[i].num = amount;
    }
    return [null, array];
}

/**
 * 成交量
 */
function volume(array){
    for(let i =0; i < array.length; i++){
        array[i].num = 1;
    }
    return [null, array];
}
function list(array){
    return [null, array];
}
/**
 * 累计收益
 * @param {*} array 
 * @param {*} flag 
 */
async function profit(array){

    //获取所有商家用户信息
    let uids = [];
    for(let i = 0; i < array.length; i++){
        uids.push(array[i].userId);
    }
    let userMoel = new PlatformUserModel();
    let [err, userList] = await userMoel.findByUids([...new Set([uids])]);
    console.log(userList);
    if(err) {
        return [err, userList] 
    }
    for(let i =0; i < array.length; i++){
        let item = array[i];
        let user = userList.find((e) => Object.is(item.userId, e.userId));
        user = user || {};
        let money = item.amount*(1-(+user.rat || 0));  //现金=点数*(1-成数)*点数单价
        item.num = money;
    }
    return [null, array]
}