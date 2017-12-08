
import AWS from "aws-sdk";

AWS.config.update({
    region : "ap-southeast-1"
})

const dbClient = new AWS.DynamoDB.DocumentClient();

export class BaseModel{
    constructor(tableName){
        this.tableName = tableName;
        this.dbClient = dbClient;
        this.createdDate = this.parseDay(new Date());
    }
    async promise(action, params, array = []) {
        return this.db$(action, params).then((result)=>{
            array = array.concat(result.Items);
            if(result.LastEvaluatedKey) {
                params.ExclusiveStartKey = result.LastEvaluatedKey;
                return this.promise(action, params, array);
            }else {
                return [null, array];
            }
        }).catch((error) => {
            console.log(error);
            return [error, []];
        })
    }
    parseDay(date){
        return date.getFullYear()+"-"+ toNumber(date.getMonth()+1)+"-"+toNumber(date.getDate());
        function toNumber(number) {
            return number > 9 ? number+"" : "0"+number; 
        }
    }
    setProperties(){
        let item = {};
        for(let key in this){
            if(!Object.is(key, "dbClient") && !Object.is(key, "tableName")){
                if(this[key] || this[key] ==0){
                    item[key] = this[key];
                }
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
    remove(key) {
        let opts = {
            Key:key,
        };
        return new Promise((reslove, reject) => {
            this.db$("delete", opts).then((result) =>{
                reslove([null, result]);
            }).catch((err) => {
                console.log(err);
                return reslove([new AError(CODES.DB_ERROR, err.stack), null]);
            });
        })
    }
    async get(conditions, returnValues = [],indexName,all){
        console.log(conditions);
        let keyConditionExpression = "";
        let expressionAttributeValues = {};
        for(let key in conditions){
            keyConditionExpression += `${key}=:${key} and `;
            expressionAttributeValues[`:${key}`] = conditions[key];
        }
        keyConditionExpression = keyConditionExpression.substr(0, keyConditionExpression.length-4);
        let opts = {
            // Key:key,
            KeyConditionExpression : keyConditionExpression,
            ExpressionAttributeValues:expressionAttributeValues,
            IndexName: indexName,
            ReturnValues : returnValues.join(",")
        }
        let [err, array] = await this.promise("query", opts);
        if(err) {
            return [err, array]
        }
        if(all) {
            return [null, array];
        }
        return [null, array[0]];
        // return new Promise((reslove, reject) => {
        //     this.db$("query",{
        //         // Key:key,
        //         KeyConditionExpression : keyConditionExpression,
        //         ExpressionAttributeValues:expressionAttributeValues,
        //         IndexName: indexName,
        //         ReturnValues : returnValues.join(",")
        //     }).then((result) => {
        //         result = result || {};
        //         result.Items = result.Items || [];
        //         return reslove([null, (all ? result.Items : result.Items[0])]);
        //     }).catch((err) => {
        //         console.log(err);
        //         return reslove([new AError(CODES.DB_ERROR, err.stack), null]);
        //     });
        // })
        
    }
 
    count(filterExpression, expressionAttributeValues){
        return new Promise((reslove, reject) => {
            this.db$("query", {
                KeyConditionExpression : filterExpression,
                ExpressionAttributeValues : expressionAttributeValues,
                Select : "COUNT",
            }).then((result) => {
                reslove([null, result.Count])
            }).catch((err) => {
                console.log(err);
                reslove([new AError(CODES.DB_ERROR, err.stack), null]);
            });
        })
       
    }
    async scan(conditions){
        let filterExpression = "";
        let expressionAttributeNames = {};
        let expressionAttributeValues = {};
        for(let key in conditions){
            filterExpression += `#${key}=:${key} and `;
            expressionAttributeNames[`#${key}`] = `${key}`;
            expressionAttributeValues[`:${key}`] = conditions[key];
        }
        let scanOpts = {};
        if(filterExpression.length!=0){
            filterExpression = filterExpression.substr(0, filterExpression.length-4);
            scanOpts = {
                FilterExpression : filterExpression,
                ExpressionAttributeNames : expressionAttributeNames,
                ExpressionAttributeValues:expressionAttributeValues
            }
        }
        return this.promise("scan", scanOpts);
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
        Object.assign(params, {TableName : this.tableName});
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

    static checkProperty(value, type, min, max, equal) {
        switch (type) {
            case "S": {
                if (!value) return [new AError(CODES.INPARAM_ERROR), null];
                let strLength = value.length,
                    error = false;
                if (min && strLength < min) error = true;
                if (max && strLength > max) error = true;
                if (equal) error = !Object.is(value, equal);
                return error ? [new AError(CODES.INPARAM_ERROR), null] : [null, value.toString().trim()];
            }
            case "N": {
                if (!value && value !== 0) return [new AError(CODES.INPARAM_ERROR), null];
                let [e, v] = this.parseNumber(value);
                if (e) return [e, 0];
                let error = false;
                if (min && v < min) error = true;
                if (max && v > max) error = true;
                if (equal) error = !Object.is(v, +equal);
                return error ? [new AError(CODES.INPARAM_ERROR), null] : [null, +value];
            }
            case "J": {
                if (!value) return [new AError(CODES.INPARAM_ERROR), null];
                return this.parseJSON(value);
            }
            case "REG": {
                if (!value) return [new AError(CODES.INPARAM_ERROR), null];
                return !equal.test(value) ? [new AError(CODES.INPARAM_ERROR), null] : [null, 0]
            }
            case "NS": {
                if (!value) {
                    return [null, 0]
                }
                let strLength = value.length, error = false
                if (min && strLength < min) error = true
                if (max && strLength > max) error = true
                if (equal) error = !Object.is(value, equal)
                return error ? [new AError(CODES.INPARAM_ERROR), null] : [null, 0]
            }
            case "NN": {
                if (!value) {
                    return [null, 0]
                }
                let [e, v] = this.parseNumber(value);
                if (e) return [e, 0];
                let error = false;
                if (min && v < min) error = true;
                if (max && v > max) error = true;
                if (equal) error = !Object.is(v, +equal);
                return error ? [new AError(CODES.INPARAM_ERROR), null] : [null, 0]
            }
            case "NREG": {
                if (!value) {
                    return [null, 0]
                }
                return !equal.test(value) ? [new AError(CODES.INPARAM_ERROR), null] : [null, 0]
            }
            default: {
                return [new AError(CODES.INPARAM_ERROR), null]
            }
        }
    }

    static checkProperties(properties, body) {
        let errorArray = []
        for (let i = 0; i < properties.length; i++) {
            let { name, type, min, max, equal } = properties[i];
            let value = body[name]
            let [checkErr,parseValue] = this.checkProperty(value, type, min, max, equal);
            if (checkErr) {
                errorArray.push(name);
            }else {
                body[name] = parseValue;
            }
        }
        return Object.is(errorArray.length, 0) ? [null, errorArray] :
            [new AError(CODES.INPARAM_ERROR), errorArray]
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
        this.msg = EMSG[code.toString()];
    }
}

const CODES = {
    JSON_FORMAT_ERROR: 10000,
    INPARAM_ERROR: 900,
    DB_ERROR: 500
}

const EMSG = {
    "10000": "数据错误",
    "900": "入参数据不合法",
    "500": "服务器错误"
}
