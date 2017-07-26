let  {Util}  = require("./lib/athena");

import { BizErr,Codes } from './lib/Codes'

import Response from "./lib/Response";

import {UserHelpModel} from "./model/UserHelpModel";

import {UserModel} from "./model/UserModel";


/**
 * 创建帮助中心
 * @param {*} event 
 * @param {*} context 
 * @param {*} callback 
 */
export async function createHelp(event, context, callback) {
    //json转换
  let [parserErr, requestParams] = Util.parseJSON(event.body);
  if(parserErr) Response.Fail(parserErr);
  //检查参数是否合法
  let [checkAttError, errorParams] = athena.Util.checkProperties([
      {name : "userId", type:"S"},
      {name : "title", type:"S"},
      {name : "genre", type:"S"},
      {name : "info", type:"S"}
  ], requestParams);

  if(checkAttError){
    Object.assign(checkAttError, {params: errorParams});
    return callback(null, Response.Fail(checkAttError));
  } 

  //保存
  let userHelpModel = new UserHelpModel(requestParams);
  let [saveError] = userHelpModel.save();
  if(saveError) return callback(null, Response.Fail(saveError));
  return callback(null, Response.Success({}));
}

/**
 * 帮助中心列表
 * @param {*} event 
 * @param {*} context 
 * @param {*} callback 
 */
export async function helpGenreList(event, context, callback){
      //json转换
  let [parserErr, requestParams] = Util.parseJSON(event.body);
  if(parserErr) Response.Fail(parserErr);

  let userId = requestParams.userId;
  let userHelpModel = new UserHelpModel({});

  //获取用户信息
  let userModel = new UserModel({userId:requestParams.userId});
  let [parentError, userInfo] = userModel.get({userId},["parent"], "UserIdIndex");
  if(parentError) return callback(null, Response.Fail(parentError));
  if(!userInfo) return callback(null, Response.Fail(BizErr.UserNotFoundErr()));
  let userParentId = userInfo.parent;
  let [genError, genreList] = await UserHelpModel.own(userId, userParentId, ["genre"]);
  if(genError) return callback(null, Response.Fail(genError));
  callback(null,Response.Success({list:genreList}));
}   