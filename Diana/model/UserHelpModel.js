let  athena  = require("../lib/athena");


const State = {
    normal : 1,  //正常,
    forzen : 2 //冻结
}
const USER_TABLE_NAME = "DianaPlatformHelp";

export class UserHelpModel extends athena.BaseModel {
    constructor({genre, userId, info, title,parent}) {
        super(USER_TABLE_NAME);
        this.genre = genre;
        this.userId = userId;
        this.title = title;
        this.parent = parent;
        this.info = info;
        this.createAt = Date.now();
    }

    /**
     * 返回自己拥有的所有类别
     * @param {*} userId 
     * @param {*} parentUserId 
     * @param {*} returnValues 
     */
    async ownGenre(userId, parentUserId){
        
    }
}

export class UserModel extends athena.BaseModel {
    constructor({userId, parent}) {
        super(USER_TABLE_NAME);
        this.userId = userId;
        this.parent = parent;
    }
}