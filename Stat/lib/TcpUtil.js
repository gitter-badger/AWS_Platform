var net = require('net');

import {
  BizErr,
  Codes
} from './all'
export  const onlineUser = async() => {
    // const host = '47.88.192.69';
    const host = '47.74.154.114';
    // const host = '192.168.3.11';
    const port = 20003;
    const proId = 12;
	var payloadLengthBuff = Buffer.alloc(4)  // 数据总长度buff
	var protocalLengthBuff = Buffer.alloc(4) // 协议长度buff
	var payloadLength = 4 * 2
    console.log(222222);
	payloadLengthBuff.writeInt32LE(payloadLength)
	protocalLengthBuff.writeInt32LE(proId)
    let buf =  Buffer.concat([payloadLengthBuff, protocalLengthBuff]);
    let client = new net.Socket();
    return new Promise((reslove, reject) => {
        console.log("请求连接");
        console.log(port, host, proId);
        client.connect(port, host, function() {
            client.write(buf);
        });
        client.on('data', function(data) {
            console.log(data);
            // console.log(data.readUInt32LE(0,4).toString(10));
            // console.log(data.readUInt32LE(4,8).toString(10));
            console.log(data.readUInt32LE(8).toString(10));
            let online = +data.readUInt32LE(8,12).toString(10);
            // 完全关闭连接
            client.destroy();
            reslove([null, online]);
        });
        client.on("error", function(err){
            reslove([null, 0]);
        })
    })
}




// pushUserInfo(BuildPayload(9,JSON.stringify({a:1,b:"汉字"})));