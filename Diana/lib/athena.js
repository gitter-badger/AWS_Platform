
import AWS from "aws-sdk";

AWS.config.update({
    region : "us-east-2"
})

const dbClient = new AWS.DynamoDB.DocumentClient();

export class BaseModel{
    constructor(tableName){
        this.tableName = tableName;
        this.dbClient = dbClient;
    }

    setProperties(){
        let item = {};
        for(let key in this){
            if(!Object.is(key, "dbClient") && !Object.is(key, "tableName")){
                item[key] = this[key];
            }
        }
        return item;
    }
    save(){
        let item = this.setProperties();
        return new Promise((reslove, reject) => {
            this.db$("put", {Item:item}).then((result) => {
                return reslove([null, result]);
            }).catch((err) => {
                console.log(err);
                return reslove([new AError(CODES.DB_ERROR, err.stack), null]);
            })
        })
    }
    get(conditions, returnValues = [],indexName,all){
        let keyConditionExpression = "";
        let expressionAttributeValues = {};
        for(let key in conditions){
            keyConditionExpression += `${key}=:${key} and `;
            expressionAttributeValues[`:${key}`] = conditions[key];
        }
        keyConditionExpression = keyConditionExpression.substr(0, keyConditionExpression.length-4);
        return new Promise((reslove, reject) => {
            this.db$("query",{
                // Key:key,
                KeyConditionExpression : keyConditionExpression,
                ExpressionAttributeValues:expressionAttributeValues,
                IndexName: indexName,
                ReturnValues : returnValues.join(",")
            }).then((result) => {
                result = result || {};
                result.Items = result.Items || [];
                return reslove([null, (all ? result.Items : result.Items[0])]);
            }).catch((err) => {
                console.log(err);
                return reslove([new AError(CODES.DB_ERROR, err.stack), null]);
            });
        })
    }
    update(key, updates){
        let keys = Object.keys(updates);
        let values = Object.values(updates);
        let opts = {
            Key:key, 
            UpdateExpression : "set ", 
            ExpressionAttributeValues : {},
            ExpressionAttributeNames : {}
        };

        keys.forEach((k, index) => {
            opts.UpdateExpression += `#${k}=:${k} `;
            opts.ExpressionAttributeValues[`:${k}`] = updates[k];
            opts.ExpressionAttributeNames[`#${k}`] = k;
            if(index != keys.length -1) opts.UpdateExpression += ", ";
        });

        return new Promise((reslove, reject) => {
            this.db$("update", opts).then((result) =>{
                reslove([null, result]);
            }).catch((err) => {
                console.log(err);
                return reslove([new AError(CODES.DB_ERROR, err.stack), null]);
            });
        })
    }

    async page({pageNumber, pageSize, conditions = {}, returnValues= [], scanIndexForward, indexName}){
        let page = new Page(pageNumber, pageSize);
        let opts = {
            IndexName : indexName,
            Limit : pageSize, 
            ScanIndexForward : scanIndexForward,
            ProjectionExpression : Object.is(returnValues.length, 0) ? "" : 
                returnValues.join(", "),
            KeyConditionExpression :"",
            ExpressionAttributeValues : {}
        }
        let countKeyConditionExpression = "",
            conuntExpressionAttributeValues = {}
        let keys = Object.keys(conditions);
        keys.forEach((k, index) => {
            let equalMode = " = ",
                value = conditions[k];
            if(Object.is(typeof conditions[k], "object")){
                let pro = conditions[k];
                for(let key in pro) {
                    switch (key) {
                        case "$gt": equalMode = ">";
                        case "$lt" : equalMode = "<";
                        case "$gte" : equalMode = ">=";
                        case "$lte" : equalMode = "<=";
                        default:
                            break;
                    }
                    value = pro[key];
                    break;
                }
            }else{
                countKeyConditionExpression = `${k}${equalMode}:${k}`;
                conuntExpressionAttributeValues[`:${k}`] = value;
            }
            opts.KeyConditionExpression += `${k}${equalMode}:${k}`;
            opts.ExpressionAttributeValues[`:${k}`] = value;
            if(index != keys.length -1) opts.KeyConditionExpression += " and ";
        });

        let [countError, count ]= await this.count(countKeyConditionExpression, conuntExpressionAttributeValues);
        if(countError) return [countError, page];
        page.setTotal(count);
        return new Promise((reslove, reject)=>{
            this.db$("query", opts).then((result) => {
                page.setData(result.Items);
                reslove([null, page])
            }).catch((err) => {
                console.log(err);
                reslove([new AError(CODES.DB_ERROR, err.stack)], page);
            })
        })
    }

    async last({skip, conditions, returnValues, indexName,lastRecord}){
        let maxLimit = skip;
        let opts = {
            IndexName : indexName,
            LastEvaluatedKey : lastRecord,
            Limit : skip, 
            ProjectionExpression : Object.is(returnValues.length, 0) ? "" : 
                returnValues.join(", "),
            KeyConditionExpression :"",
            ExpressionAttributeValues : {}
        }

        keys.forEach((k, index) => {
            let equalMode = " = ",
                value = conditions[k];
            opts.KeyConditionExpression += `${k}${equalMode}:${k}`;
            opts.ExpressionAttributeValues[`:${k}`] = value;
            if(index != keys.length -1) opts.KeyConditionExpression += " and ";
        });

        return new Promise((reslove, reject)=>{
            this.db$("query", opts).then((result) => {
                reslove([null, result.LastEvaluatedKey])
            }).catch((err) => {
                console.log(err);
                reslove([new AError(CODES.DB_ERROR, err.stack)], null);
            })
        })
    }

    count(filterExpression, expressionAttributeValues){
        return new Promise((reslove, reject) => {
            this.db$("query", {
                KeyConditionExpression : filterExpression,
                ExpressionAttributeValues : expressionAttributeValues,
                ReturnValues : "username"
            }).then((result) => {
                reslove([null, result.Count])
            }).catch((err) => {
                console.log(err);
                reslove([new AError(CODES.DB_ERROR, err.stack), null]);
            });
        })
       
    }
   
    isExist(key){
        return new Promise((reslove, reject) => {
            this.db$("get",{Key:key}).then((result) => {
                result = JSON.stringify(result)
                return reslove([null, Object.is(result,"{}") ? false : true]);
            }).catch((err) => {
                console.log(err);
                return reslove([new AError(CODES.DB_ERROR, err.stack), false]);
            });
        })
    }
    db$(action, params){
        return this.dbClient[action](params).promise();
    }
}

class Page{
    constructor(pageNumber, pageSize){
        this.pageNumber = pageNumber;
        this.pageSize = pageSize;
        this.total = 0;
        this.data = [];
    }
    setTotal(total){
        this.total = total;
    }
    setData(data){
        this.data = data;
    }
}

export class Util{
    static parseJSON(obj){
        if(Object.is(typeof obj, "object")) return [null, obj];
        try{
            obj = JSON.parse(obj);
            return [null, obj];
        }catch(err){
            return [new AError(CODES.JSON_FORMAT_ERROR),null];
        }
    }

    static checkProperty(value, type, min, max, equal){
        if(!value) return [new AError(CODES.JSON_FORMAT_ERROR),null];
        switch(type){
            case "S" : {
                let strLength = value.length,
                    error = false;
                if(min && strLength < min) error = true;
                if(max && strLength > max) error = true;
                if(equal) error = !Object.is(value, equal);
                return error ? [new AError(CODES.JSON_FORMAT_ERROR),null] : [null,0];
            }
            case "N" : {
                let [e, v] = this.parseNumber(value);   
                if(e) return [e,0];
                let error = false;
                if(min && v < min) error = true;
                if(max && v > max) error = true;
                if(equal) error = !Object.is(v, +equal);
                return error ? [new AError(CODES.JSON_FORMAT_ERROR),null] : [null,0];
            }
            case "J" : {
                return this.parseJSON(value);
            }
            default :{
                return [new AError(CODES.JSON_FORMAT_ERROR),null]
            }
        }
    }

    static checkProperties(properties, body){
        let errorArray = [];
        for(let i = 0; i < properties.length; i++){
            let {name, type, min, max, equal} = properties[i];
            let value = body[name]
            let [checkErr] = this.checkProperty(value, type, min, max, equal);
            if(checkErr) errorArray.push(name);
        }
        return Object.is(errorArray.length, 0) ? [null, errorArray] : 
            [new AError(CODES.JSON_FORMAT_ERROR),errorArray]
    }

    static parseNumber(v){
        try{
            let value = +v;
            if(Number.isNaN(value)) return [new AError(CODES.JSON_FORMAT_ERROR),null]
            return [null, value];
        }catch(err){
            console.log(err);
            return [new AError(CODES.JSON_FORMAT_ERROR),null];
        }
    }
}

class AError{
    constructor(code, msg){
        this.code = code;
        this.errMsg = EMSG[code.toString()];
    }
}

const CODES = {
    JSON_FORMAT_ERROR : 10000,
    DB_ERROR : 500
}

const EMSG = {
    "10000" : "数据错误",
    "500" : "服务器错误"
}
