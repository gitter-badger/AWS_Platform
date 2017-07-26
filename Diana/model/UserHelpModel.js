
import {BaseModel} from "../lib/athena";
import {Model} from "../lib/Dynamo";


const State = {
    normal : 1,  //正常,
    forzen : 2 //冻结
}
const USER_HELP_GENRE_MODEL = "ZeusPlatformHelp";
export class userHelpGenreModel extends BaseModel {
    constructor({genre, userId, parent} = {}) {
        super(USER_HELP_GENRE_MODEL);
        this.genre = genre;
        this.userId = userId;
        this.parent = parent;
        this.sn = Model.uuid();
        this.createAt = Date.now();
        this.updateAt = Date.now();
        this.items = [];
        this.length = 0;
    }
    
    /**
     * 返回自己拥有的所有类别
     * @param {*} userId 
     * @param {*} parentUserId 
     * @param {*} returnValues 
     */
    async ownGenre(userId, flag){
        if(flag){ //查自己创建的
            return this.get({userId},["sn","userId","parent","genre"],"userIdIndex");
        }else{ //查自己可以看的
            return [0,1];
        }
    }

    async findHelpListBySn(sn){
        return this.get({userId},["items"]);
    }

    async pushHelpBySn(sn, item){
        let [err, help] = await this.get({sn},["length"]);
        if(err || !help){
            return [err, help];
        }
        let length = help.length;
        let updates = {};
        updates[`items.${length}`] = item;
        updates.length = length++;
        return this.update({sn}, item);
    }
}
export class UserHelpModel{
    constructor({title, info} = {}) {
        this.title = title;
        this.info = info;
        this.sn = Model.uuid();
        this.createAt = Date.now();
        this.updateAt = Date.now();
    }
}

export class UserModel extends BaseModel {
    constructor({userId, parent}) {
        super(USER_TABLE_NAME);
        this.sn = Model.uuid();
        this.createAt = Date.now();
        this.userId = userId;
        this.parent = parent;
    }
}
