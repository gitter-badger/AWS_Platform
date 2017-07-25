var https = require("https");

var https = require('https');

var post_data={
    "userName" : "lisichen11",
    "userPwd" : "zhangsan",
    "apiKey" : "a",
    "buId" : "merchantID_3",
    "userType" : 1,
    "gamePlatform" : "NA"
};//请求数据
var reqdata = JSON.stringify(post_data);
var options = {
    hostname: '1emqyhik84.execute-api.us-east-2.amazonaws.com',
    port: '443',
    path: '/dev/player/register',
    method: 'POST',
    headers: {
        'Content-Type': 'Application/json',
        "Content-Length":reqdata.length
    }
};

var req = https.request(options, function (res) {
    res.on("data", function(data){
        console.log(data.toString());
    })
    res.on("error", function(error){
        console.log(error);
    })
});
req.write(reqdata);