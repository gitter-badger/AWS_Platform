
import {Util} from "./lib/athena";

import { BizErr,Codes } from './lib/Codes'

import {Success, Fail} from "./lib/Response";

import {UserHelpModel, UserHelpGenreModel} from "./model/UserHelpModel";

import {UserModel} from "./model/UserModel";


import {RoleCodeEnum} from "./lib/Consts";


/**
 * 创建帮助中心类别
 * @param {*} event 
 * @param {*} context 
 * @param {*} callback 
 */
export async function createHelpGenre(event, context, callback) {
  console.log(event);
    //json转换
  let [parserErr, requestParams] = athena.Util.parseJSON(event.body);
  if(parserErr) return callback(null, ReHandler.fail(parserErr));
  
  const [tokenErr, token] = await Model.currentToken(event);
  if (tokenErr) {
      return ResErr(cb, tokenErr)
  }
  const [e, tokenInfo] = await JwtVerify(token[1])
  if(e) {
      return ResErr(cb, e)
  }
  
    //json转换
  // let [parserErr, requestParams] = Util.parseJSON(event.body);
  
  if(parserErr) Fail(parserErr);

  //检查参数是否合法
  let [checkAttError, errorParams] = Util.checkProperties([
      {name : "genre", type:"S"},
      {name : "parent", type:"S"}
  ], requestParams);
  requestParams.userId = tokenInfo.userId;

  //判断是否有权限(商户不能创建帮助中心)
  if(tokenInfo.role == RoleCodeEnum.Merchant){
    // return callback(null, Fail(new ));
  }

  if(checkAttError){
    Object.assign(checkAttError, {params: errorParams});
    return callback(null, Fail(checkAttError));
  } 

  //保存
  let userHelpGenreModel = new UserHelpGenreModel(requestParams);
  let [saveError] = await userHelpModel.save();
  if(saveError) return callback(null, Fail(saveError));
  return callback(null, Success({}));
}

/**
 * 创建帮助中心
 * @param {*} event 
 * @param {*} context 
 * @param {*} callback 
 */
export async function createHelp(event, context, callback) {
    //json转换
  let [parserErr, requestParams] = Util.parseJSON(event.body);
  if(parserErr) Fail(parserErr);

  //检查参数是否合法
  let [checkAttError, errorParams] = Util.checkProperties([
      {name : "genreSn", type:"S"},
      {name : "title", type:"S"},
      {name : "info", type:"S"},
  ], requestParams);

  if(checkAttError){
    Object.assign(checkAttError, {params: errorParams});
    return callback(null, Fail(checkAttError));
  } 

  let userHelpModel = new UserHelpModel(requestParams);
  let genreModel = new UserHelpGenreModel();
  let [e, v] = genreModel.pushHelpBySn(requestParams.genreSn, userHelpModel);
  if(e) return callback(null, Fail(saveError));
  return callback(null, Success({}));
}

/**
 * 帮助中心类别列表
 * @param {*} event 
 * @param {*} context 
 * @param {*} callback 
 */
export async function helpGenreList(event, context, callback){
      //json转换
  let [parserErr, requestParams] = Util.parseJSON(event.body);

  if(parserErr){
     return Fail(parserErr);
  }
  //检查参数是否合法
  let [checkAttError, errorParams] = Util.checkProperties([
      {name : "userId", type:"S"},
      {name : "action", type:"N"}
  ], requestParams);
  if(checkAttError){
     return Fail(checkAttError);
  }

  let userId = requestParams.userId;
  let userHelpModel = new UserHelpModel({});
  let action = +requestParams.action;

  //获取用户信息
  let userModel = new UserModel({userId:requestParams.userId});
  let [parentError, userInfo] = userModel.get({userId},["parent"], "UserIdIndex");
  if(parentError){
     return callback(null, Fail(parentError));
  }
  if(!userInfo){
     return callback(null, Fail(BizErr.UserNotFoundErr()));
  }
  //添加类别查询自己可选择的类型
  let [genError, genreList] = await userHelpModel.ownGenre(userId, action ==1 ? true : false);
  let userParentId = userInfo.parent;
  
  if(genError) {
     return callback(null, Fail(genError));
  }

  callback(null,Success({list:genreList}));
}

/**
 * 根据sn找到帮助列表
 * @param {*} event 
 * @param {*} context 
 * @param {*} callback 
 */
export async function findHelpItems(event, context, callback){
     //json转换
  let [parserErr, requestParams] = Util.parseJSON(event.body);

  if(parserErr){
     return Fail(parserErr);
  }
  //检查参数是否合法
  let [checkAttError, errorParams] = Util.checkProperties([
      {name : "genSn", type:"S"},
      {name : "sn", type:"S"},
      {name : "title", type:"S"},
      {name : "info", type:"S"},
  ], requestParams);
  if(checkAttError){
     return Fail(checkAttError);
  }
  
  var userHelpGenreModel = new UserHelpGenreModel();
  let [error, helpInfo] = await userHelpGenreModel.get({sn:requestParams.genSn},["items"]);
  if(error){
    return callback(null, Fail(error));
  }
  helpInfo = helpInfo || {};
  callback(null, Success({list:helpInfo.items}));
}

/**
 * 修改帮助
 * @param {*} event 
 * @param {*} context 
 * @param {*} callback 
 */
export async function updateHelp(event, context, callback){

 
}
