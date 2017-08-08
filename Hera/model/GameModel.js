let {RoleCodeEnum} = require("../lib/Consts");


import {BaseModel} from "../lib/athena"

import {
    Tables,
} from '../lib/all'



export class GameModel extends BaseModel{
    constructor({gameId} = {}) {
        super(Tables.ZeusPlatformGame);
        this.gameId = gameId
    }

    findByIds(gameIds){
        let filterExpression = "",
            expressionAttributeValues = {};
        for(var i =0; i < uids.length; i++){
            filterExpression += `gameId=:gameId${i} or `;
            expressionAttributeValues[`:gameId${i}`] = gameIds[i];
        }
        filterExpression = filterExpression.substring(0, filterExpression.length -3);
        return new Promise((reslove, reject) => {
            this.db$("scan", {
                TableName : this.tableName,
                FilterExpression : filterExpression,
                ExpressionAttributeValues : expressionAttributeValues
            }).then((result) => {
                reslove([null, result.Items]);
            }).catch((err) => {
                reslove([err, 0]);
            })
        })
    }
    async getCompanyById(gameId){
        let [gameErr, game] = await this.get({gameId}, [], "GameIdIndex");
        if(gameErr || !game){
            return [gameErr, game]
        }
        let company = game.company;
        return [null, company];
    }
    async findByKindId(kindId){
        let [gameErr, game] = await this.get({kindId}, [], "KindIdIndex");
        return [gameErr, game]
    }
    async findSingleByType(gameType){
        console.log("gameType: "+gameType);
        let filterExpression = "gameType = :gameType",
            expressionAttributeValues = {
                ":gameType" : gameType
            };
        return new Promise((reslove, reject) => {
            this.db$("scan", {
                TableName : this.tableName,
                FilterExpression : filterExpression,
                ExpressionAttributeValues : expressionAttributeValues
            }).then((result) => {
                result.Items = result.Items || [];
                reslove([null, result.Items[0]]);
            }).catch((err) => {
                reslove([err, 0]);
            })
        })
    }
}
