let  athena  = require("../lib/athena");
import {TABLE_NAMES} from "../config";
import {Util} from "../lib/Util";


export class ToolPackageModel extends athena.BaseModel {
    constructor({num, price, toolId, name} = {}) {
        super(TABLE_NAMES.TOOL_PACKAGE);
    }
    
}

