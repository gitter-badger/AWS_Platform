/**
 * 游戏公告
 */
let  athena  = require("../lib/athena");
import {Tables,Model} from "../lib/Dynamo"
import {Util} from "../lib/Util";
import {UserModel}  from "./UserModel"
/**
 * 邮件状态
 */
const EmailState = {
    notSend : 0,  //未发送
    alreadySend :1  //已发送
}


export class EmailModel extends athena.BaseModel {
    constructor({emid, userId, content,  state, msn, sendTime,title,sendUser,nickname,tools, sendUserId} = {}) {
        super(Tables.HawkeyeGameEmail);
        this.userId = userId || -1;    //创建者
        this.title = title;
        this.nickname = nickname || Model.StringValue;
        this.emid = emid || Util.uuid();
        this.content = content;
        this.createdAt = Date.now();
        this.msn = msn;  //线路号
        this.sendTime = +sendTime;
        this.sendUserId = sendUserId || Model.StringValue;
        this.sendUser = sendUser || Model.StringValue;
        this.state = state || EmailState.notSend;
        this.tools = tools;
    }
    setTools(toolList, toolNumbers) {
        let tools = [];
        toolList.forEach(function(element) {
            let toolId = element.toolId;
            let tool = toolNumbers.find((item) => item.toolId == toolId);
            if(!tool) return;
            tools.push({
                toolId : toolId,
                icon : element.icon? element.icon : Model.StringValue,
                number : tool.number,
                toolName : element.toolName
            })
        }, this);
        this.tools = tools;
    }
    async isUser(userId) {
        if(this.nickname == Model.StringValue) {
            return [null, true];
        } 
        let userModel = new UserModel();
        let [getError, userInfo] = await userModel.get({userId},[],"userIdIndex");
        if(getError) {
            return [getError, null]
        }
        if(userInfo.nickname == this.sendUser){
            return [null, true]
        }
        return [null, false]
    }
    async findByIds(emids) {
        let filterExpression = "",
            expressionAttributeValues = {};
        for(var i =0; i < emids.length; i++){
            filterExpression += `emid=:emid${i} or `;
            expressionAttributeValues[`:emid${i}`] = emids[i];
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
}