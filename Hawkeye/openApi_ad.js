
let athena = require("./lib/athena");

import { CODES, CHeraErr } from "./lib/Codes";

import { ReHandler } from "./lib/Response";

import { RoleCodeEnum, SeatTypeEnum, SeatContentEnum, ToolIdEnum } from "./lib/Consts"


import { AdModel } from "./model/AdModel";

import { Util } from "./lib/Util"

/**
 * 广告列表
 * @param {*} event 
 */
async function advertList(event, context, callback) {
  let [parserErr, requestParams] = athena.Util.parseJSON(event.body || {});
  if (parserErr) return callback(null, ReHandler.fail(parserErr));
  let adModel = new AdModel();
  let [scanErr, list] = await new AdModel().list(requestParams);
  if (scanErr) {
    return callback(null, ReHandler.fail(scanErr));
  }
  callback(null, ReHandler.success({
    data: { list }
  }));
}


export {
  advertList   //广告列表
}