var net = require('net');

const HOST = '192.168.3.98';
const PORT = 20003;
const proId = 9;  //协议


export const pushUserInfo =  (body) => {
    let client = new net.Socket();
    let buffer = buildPayload(proId, JSON.stringify(body));
    client.connect(PORT, HOST, function() {
        client.write(JSON.stringify(body));
    });
    client.on('data', function(data) {
        console.log('DATA: ' + data);
        // 完全关闭连接
        client.destroy();
    });
    
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

