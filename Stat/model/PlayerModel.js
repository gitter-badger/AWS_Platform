let  athena  = require("../lib/athena");
import {Tables} from "../lib/Dynamo"

export class PlayerModel extends athena.BaseModel {
    constructor({userName, userPwd, buId, state, merchantName,  msn, sex, paymentState, nickname, headPic} = {}) {
        super(Tables.HeraGamePlayer);
    }
    async sumCount(){
        let [agentErr, agentCount] = await this.count("msn=:msn",{":msn":"000"});
        if(agentErr) {
            return [agentErr, 0];
        }
        let [sumErr, sum] = await this.count(null, null);
        if(sumErr) {
            return [sumErr, 0];
        }
        return [null, sum - agentCount];
    }
    async agentCount(){
        let [agentErr, agentCount] = await this.count("msn=:msn",{":msn":"000"});
        if(agentErr) {
            return [agentErr, 0];
        }
        return [null, agentCount];
    }
    async online(){
        let [agentErr, agentCount] = await this.count("(gameState=:state1 or gameState =:state2) and msn=:msn",
        {":msn":"000",":state1" : 2, ":state2" : 3});
        if(agentErr) {
            return [agentErr, 0];
        }
        let [sumErr, sum] = await this.count("gameState=:state1 or gameState =:state2",{":state1" : 2, ":state2" : 3});
        console.log(agentCount+"     "+sum);
        if(sumErr) {
            return [sumErr, 0];
        }
        return [null, sum - agentCount];
    }
    async statCount(buIds) {
        let [palyErr, list] = await this.scan({},"msn,gameState,parent");
        if(palyErr) {
            return [palyErr, {}];
        }
        let sum = 0;
        let online =0;
        list.forEach(function(element) {
            if(element.msn != "000") {
                if(!buIds) {
                    sum ++;
                    if(element.gameState ==2  || element.gameState ==3) {
                        online ++;
                    }
                }else {
                    let parent = element.parent;
                    if(buIds.indexOf(parent) != -1) {
                        sum ++;
                        if(element.gameState ==2  || element.gameState ==3) {
                            online ++;
                        }
                    }
                }
                
            }
        }, this);
        return [null,  {oneNum : online, twoNum:sum}];
    }
}