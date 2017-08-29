import https from 'https'
import http from "http"
import url from 'url'
import fs from "fs"

import {
  BizErr,
  Codes
} from '../lib/all'

import {Util} from "../lib/athena";
export function httpsRequest(addr, post_data){
    console.log(post_data);
    let queryUrl = url.parse(addr);
    let {hostname, port, path} = queryUrl;
    var reqdata = JSON.stringify(post_data);
    var options = {
        "hostname": hostname,
        "port": port,
        "path": path,
        "method": "POST",
        'Content-Type': 'Application/json',
        "Content-Length":reqdata.length
    };
    console.log(options);
    return new Promise((reslove, reject) => {
        var req = https.request(options, function (res) {
            let str = "";
            res.on("data", (chunk) => str += chunk);
            res.on("end", () => {
                console.log(str);
                
                reslove(Util.parseJSON(str));
            })
        });
        req.write(reqdata);
        req.end();
        req.on('error', function (e) {
            console.log(e);
            reslove([BizErr.HttpsErr(), 0]);
        });
    })
}

export function httpRequest(addr, post_data){
    console.log("请求开始");
    console.log(addr);
    let queryUrl = url.parse(addr);
    let {hostname, port, path} = queryUrl;
    var reqdata = JSON.stringify(post_data);
    console.log(reqdata);
    var options = {
        "hostname": hostname,
        "port": port,
        "path": path,
        "method": "POST",
        "headers" : {
            'Content-Type': 'application/json',
            "Content-Length":reqdata.length
        }
    };
    return new Promise((reslove, reject) => {
        var req = http.request(options, function (res) {
            let str = "";
            res.on("data", (chunk) => str += chunk);
            res.on("end", () => {
                str = str.trim();
                console.log(str);
                let [err, obj] = Util.parseJSON(str);
                if(err) reslove([err,null]);
                if(obj.code != 0) {
                    reslove([obj,null]);
                }else {
                    reslove([null,obj]);
                }
                
            })
        });
        req.write(reqdata);
        req.end();
        req.on('error', function (e) {
            console.log(e);
            // reslove([BizErr.HttpsErr(), 0]);
            reslove([null, {url : "www.baidu.com"}]);
        });
    })

}
