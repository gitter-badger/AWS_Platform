var net = require('net');

import {
  BizErr,
  Codes
} from './all'


// const host = '192.168.3.11';
// const host = '47.88.192.69'; //生产环境
// const host = '47.74.154.114';  //开发环境
const host = '47.74.152.121';  //正式环境

export  const onlineUser = async(body) => {
    let client = new net.Socket();
    const port = 20003;
    const proId = 12;
    let buffer = buildPayload(proId, JSON.stringify(body));
    return new Promise((reslove, reject) => {
        console.log("请求连接");
        console.log(port, host, proId);
        client.connect(port, host, function() {
            client.write(buffer);
        });
        client.on('data', function(data) {
            console.log(data);
            // console.log(data.readUInt32LE(0,4).toString(10));
            // console.log(data.readUInt32LE(4,8).toString(10));
            let num = +data.readUInt32LE(8,12).toString(10);
            // 完全关闭连接
            client.destroy();
            console.log("num:"+num);
            reslove([null, +num]);
        });
        client.on("error", function(err){
            console.log(err);
            reslove([null, 0]);
        })
    })
}

var buildPayload = function (protocalId, data) {
	var dataBuffer = Buffer.from(data, 'utf8')
	var dataLength = dataBuffer.length
	var payloadLengthBuff = Buffer.alloc(4)  // 数据总长度buff
	var protocalLengthBuff = Buffer.alloc(4) // 协议长度buff
	var dataLengthBuff = Buffer.alloc(4)
	var payloadLength = 4 * 3 + dataLength

	payloadLengthBuff.writeInt32LE(payloadLength)
	protocalLengthBuff.writeInt32LE(protocalId)
	dataLengthBuff.writeInt32LE(dataLength)

   
    return  Buffer.concat([payloadLengthBuff, protocalLengthBuff, dataLengthBuff, dataBuffer])

}




// pushUserInfo(BuildPayload(9,JSON.stringify({a:1,b:"汉字"})));