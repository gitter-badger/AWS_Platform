
let  athena  = require("./lib/athena");

import {CODES, CHeraErr} from "./lib/Codes";

import {ReHandler} from "./lib/Response";

import {RoleCodeEnum,SeatTypeEnum, SeatContentEnum, ToolIdEnum} from "./lib/Consts"


import {AdvertModel} from "./model/AdvertModel";

import {Util} from "./lib/Util"

/**
 * 广告列表
 * @param {*} event 
 */
async function advertList(event, context, callback) {
  let advertModel = new AdvertModel();
  let [scanErr, list] = await advertModel.scan({adStatus :1});
  callback(null, ReHandler.success({
      data :{list}
  }));
}


export{
  advertList, //广告列表
}