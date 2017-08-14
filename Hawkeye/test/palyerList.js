var https = require("https");

var https = require('https');

var post_data={};//请求数据
var reqdata = JSON.stringify(post_data);
var options = {
    hostname: 'z9ncfx0q9d.execute-api.ap-southeast-1.amazonaws.com',
    port: '443',
    path: '/dev/player/list',
    method: 'GET',
    headers: {
        'Content-Type': 'Application/json',
        "Content-Length":reqdata.length,
        "Authorization" : "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6Ik5BX2NoZW53ZW4iLCJtc24iOiIxMDAiLCJzdWZmaXgiOiJOQSIsInVzZXJJZCI6ImFiYyIsInJvbGUiOiIxMDAiLCJkaXNwbGF5TmFtZSI6IuWVhuaIt-WQjeensCIsImFwaUtleSI6ImEiLCJkaXNwbGF5SWQiOjEyMywidXBkYXRlZEF0IjoxNTAxMTI0NzY3Mzg2LCJpYXQiOjE1MDExMjQ3Mzd9.16PKLVM167dw0630-Dr0kDDIMUKv_fWQy_TDhzHL3VU"
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