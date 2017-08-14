var https = require("https");

var https = require('https');

var post_data={
    
};//请求数据
var reqdata = JSON.stringify(post_data);
var options = {
    hostname: '1emqyhik84.execute-api.us-east-2.amazonaws.com',
    port: '443',
    path: '/dev/player',
    method: 'POST',
    headers: {
        'Content-Type': 'Application/json',
        "Content-Length":reqdata.length,
        "Authorization" : "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyTmFtZSI6IkhBX2xpc2ljaGVuIiwiaWF0IjoxNTAwOTg5MzI0fQ.PqouByRz1UIXbS9nO6RD68q3Qgj8vvv85L08IPBmjBs"
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