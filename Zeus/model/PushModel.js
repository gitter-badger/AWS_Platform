
import { pushUserInfo} from "../lib/TcpUtil"


const State = {
    normal: 1,  //正常,
    forzen: 2 //冻结
}
// const host = '192.168.3.11';
// const host = '47.88.192.69';   //生产环境
// const host = '47.74.154.114';  //开发环境
// const host = '47.74.152.121';  //正式环境
const host = process.env.NA_CENTER;  //推送大厅地址
const port = 20003;
export class PushModel {
    constructor({} = {}) {
        
    }
    pushForzen(obj) {
        const proId = 13;  //协议
        // console.info(this);
        // return pushUserInfo(this, host, port, proId);
        return pushUserInfo(obj, host, port, proId);
    }
    
}