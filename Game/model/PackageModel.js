let  athena  = require("../lib/athena");
import {TABLE_NAMES} from "../config";
import {Util} from "../lib/Util";


export class PackageModel extends athena.BaseModel {
    constructor({num, price, toolId, name} = {}) {
        super(TABLE_NAMES.TOOL_PACKAGE);
        this.num = num;
        this.price = price;
        this.toolId = toolId;
        this.name = name;
    }
    /**
     * 获取钻石
     */
    getDiamonds(){
        return this.get({toolId:"1"},[], "toolIdIndex")
    }
    
}

