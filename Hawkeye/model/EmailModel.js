/**
 * 游戏公告
 */
let  athena  = require("../lib/athena");
import {Tables,Model} from "../lib/Dynamo"
import {Util} from "../lib/Util";
/**
 * 邮件状态
 */
const EmailState = {
    notSend : 0,  //未发送
    alreadySend :1  //已发送
}


export class EmailModel extends athena.BaseModel {
    constructor({userId, content,  state, msn, sendTime,title,sendUser,nickname} = {}) {
        super(Tables.HawkeyeGameEmail);
        this.userId = userId;    //创建者
        this.title = title;
        this.nickname = nickname || Model.StringValue;
        this.emid = Util.uuid();
        this.content = content;
        this.createdAt = Date.now();
        this.msn = msn;  //线路号
        this.sendTime = +sendTime;
        this.sendUser = sendUser || Model.StringValue;
        this.state = state || EmailState.notSend;
        this.tools = [];
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
}