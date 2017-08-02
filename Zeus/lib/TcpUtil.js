var net = require('net');

const HOST = '47.88.192.69';
// const HOST = '192.168.3.98';
const PORT = 20003;
const proId = 9;  //协议
import {
  BizErr,
  Codes
} from '../lib/all'

export const pushUserInfo =  (body) => {
    let client = new net.Socket();
    let buffer = buildPayload(proId, JSON.stringify(body));
    return new Promise((reslove, reject) => {
        console.log("请求连接");
        client.connect(PORT, HOST, function() {
            client.write(buffer);
        });
        client.on('data', function(data) {
            // console.log(data.readUInt32LE(0,4).toString(10));
            // console.log(data.readUInt32LE(4,8).toString(10));
            let code = +data.readUInt32LE(8,12).toString(10);
            // 完全关闭连接
            client.destroy();
            if(code != Codes.OK) {
                reslove([BizErr.PushMerchantError(), {code:code}]);
            }else {
                reslove([null, 0]);
            }
        });
        client.on("error", function(err){
            reslove([BizErr.TcpErr(), 0]);
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

