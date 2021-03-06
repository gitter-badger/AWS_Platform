
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
            let e = new AError(CODES.DB_ERROR);
            e.errMsg = error.message;
            return [e, []];
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
    async get(conditions, returnValues = [],indexName,all){
        let keyConditionExpression = "";
        let expressionAttributeValues = {};
        for(let key in conditions){
            keyConditionExpression += `${key}=:${key} and `;
            expressionAttributeValues[`:${key}`] = conditions[key];
        }
        keyConditionExpression = keyConditionExpression.substr(0, keyConditionExpression.length - 4);
        let opts = {
            KeyConditionExpression : keyConditionExpression,
            ExpressionAttributeValues:expressionAttributeValues,
            IndexName: indexName
        }
        if(returnValues.length > 0) {
            opts.ExpressionAttributeNames = {};
            returnValues.map((item, index) => {
                returnValues[index] = "#"+item;
                opts.ExpressionAttributeNames[returnValues[index]] = item;
            })
            opts.ProjectionExpression = returnValues.join(",");
        }
        let [err, array] = await this.promise("query", opts);
        if(err) {
            return [err, array]
        }
        if(all) {
            return [null, array];
        }
        return [null, array[0]];
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
    async scan(conditions){
        let filterExpression = "";
        let expressionAttributeValues = {};
        let expressionAttributeNames = {};
        for(let key in conditions){
            filterExpression += `#${key}=:${key} and `;
            expressionAttributeValues[`:${key}`] = conditions[key];
            expressionAttributeNames[`#${key}`]  = key;
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
    async scanByOpts(scanOpts){
        return this.promise("scan", scanOpts);
        // return new Promise((reslove, reject) => {
        //     this.db$("scan", scanOpts).then((result) => {
        //         result = result || {};
        //         result.Items = result.Items || [];
        //         return reslove([null, result.Items || []]);
        //     }).catch((err) => {
        //         console.log(111);
        //         console.log(err);
        //         return reslove([new AError(CODES.DB_ERROR, err.stack), []]);
        //     });
        // })
    }
    /**
     * 1,搜索满足的所有记录(只返回排序键)
     * 2，排好序后根据排序条件继续搜索
     * @param {*} pageNumber 
     * @param {*} pageSize 
     * @param {*} conditions 
     * @param {*} returnValues 
     * @param {*} sortkey 
     * @param {*} sort 
     */
    async page(conditions = {}, pageNumber, pageSize,  sortkey, sort, returnValues = []) {
        let page = {
            pageNumber,
            pageSize
        }
        let opts = this.buildQueryParams(conditions);
        //得到总数
        let [countError, count] = await this.pageCount(opts);
        if(countError) return [countError, page];
        page.total = count;
        //找到满足所有条件的记录的排序键
        opts.ProjectionExpression = sortkey;
        let [sortKeysErr, sortList] = await this.scanByOpts(opts);
        if(sortKeysErr)  return [sortKeysErr, null];
        //排序
        let sortKeys = sortList.map((item) => item[sortkey]);
        sortKeys.sort();
        if(sort == "des") { //降序
            sortKeys.reverse();
        }
        let conditionKeys = sortKeys.slice((pageNumber-1)*pageSize, pageNumber*pageSize);
        page.pageSize = conditionKeys.length;
        if(conditionKeys.length > 0) conditions[sortkey] = {"$in": conditionKeys};
        opts = this.buildQueryParams(conditions);
        //找到满足所有条件的记录
        if(returnValues.length > 0) {
            opts.ProjectionExpression = returnValues.join(",");
        }else {
            delete opts.ProjectionExpression
        }
     
        let [listErr, list] = await this.scanByOpts(opts);
        if(listErr) {
            return [listErr, page]
        }
        page.list = list;
        return [sortKeysErr, page];
    }
    /**
     * 组建查询参数
     * @param {*} conditions 
     */
    buildQueryParams(conditions) {
        let keys = Object.keys(conditions),
            opts = {

            };
        if(keys.length > 0) {
            opts.FilterExpression = "";
            opts.ExpressionAttributeValues = {};
            opts.ExpressionAttributeNames = {};
        }
        keys.forEach((k, index) => {
            let pro = conditions[k];
            let value = pro,
                array = false;
            if(Object.is(typeof pro, "object")){
                for(let key in pro) {
                    value = pro[key];
                    switch (key) {
                        case "$like": {
                            opts.FilterExpression += `contains(#${k}, :${k})`;
                            break;
                        }
                        case "$in" : {
                            array = true;
                            opts.ExpressionAttributeNames[`#${k}`] = k;
                            for(let i = 0; i < value.length; i ++){
                                if(i == 0)opts.FilterExpression += "(";
                                opts.FilterExpression += `#${k} = :${k}${i}`;
                                if(i != value.length -1) {
                                    opts.FilterExpression += " or ";
                                }
                                if(i == value.length -1) {
                                    opts.FilterExpression += ")";
                                }
                                opts.ExpressionAttributeValues[`:${k}${i}`] = value[i];
                            }
                            break;
                        }
                        case "$range" :{
                            array = true;
                            opts.ExpressionAttributeNames[`#${k}`] = k;
                            opts.FilterExpression += `#${k} between :${k}0 and :${k}1`;
                            opts.ExpressionAttributeValues[`:${k}0`] = value[0];
                            opts.ExpressionAttributeValues[`:${k}1`] = value[1];
                            break;
                        }
                    }
                    break;
                }
            }else {
                opts.FilterExpression += `#${k} = :${k}`;
            }
            if(!array) {
                opts.ExpressionAttributeValues[`:${k}`] = value;
                opts.ExpressionAttributeNames[`#${k}`] = k;
            }
            if(index != keys.length -1) opts.FilterExpression += " and ";
        });
        return opts;
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
    pageCount(opts) {
        opts.Select = "COUNT";
        return new Promise((reslove, reject) => {
            this.db$("scan", opts).then((result) => {
                reslove([null, result.Count]);
                delete opts.Select;
            }).catch((err) => {
                console.log(err);
                delete opts.Select;
                reslove([new AError(CODES.DB_ERROR, err.stack), null]);
            });
        })
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
        params.TableName = this.tableName;
        // Object.assign(params, {TableName : this.tableName});
        return this.dbClient[action](params).promise();
    }
}

class Page{
    constructor(curPage, pageSize){
        this.curPage = curPage;
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
                return error ? [new AError(CODES.INPARAM_ERROR), null] : [null, value];
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
