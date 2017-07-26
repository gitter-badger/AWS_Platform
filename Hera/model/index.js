"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.Util = exports.BaseModel = undefined;

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _awsSdk = require("aws-sdk");

var _awsSdk2 = _interopRequireDefault(_awsSdk);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

_awsSdk2.default.config.update({
    region: "us-east-2"
});

var dbClient = new _awsSdk2.default.DynamoDB.DocumentClient();

var BaseModel = exports.BaseModel = function () {
    function BaseModel(tableName) {
        _classCallCheck(this, BaseModel);

        this.tableName = tableName;
        this.dbClient = dbClient;
    }

    _createClass(BaseModel, [{
        key: "setProperties",
        value: function setProperties() {
            var item = {};
            for (var key in this) {
                if (!Object.is(key, "dbClient") && !Object.is(key, "tableName")) {
                    item[key] = this[key];
                }
            }
            return item;
        }
    }, {
        key: "save",
        value: function save() {
            var _this = this;

            var item = this.setProperties();
            return new Promise(function (reslove, reject) {
                _this.db$("put", { Item: item }).then(function (result) {
                    return reslove([null, result]);
                }).catch(function (err) {
                    return reslove([new AError(CODES.DB_ERROR, err.stack), null]);
                });
            });
        }
    }, {
        key: "get",
        value: function get(key) {
            var _this2 = this;

            var returnValues = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];

            console.log("444444");
            console.log({
                Key: key,
                ReturnValues: returnValues.join(",")
            });
            console.log("22222222222222222");
            return new Promise(function (reslove, reject) {
                _this2.db$("get", {
                    Key: key,
                    ReturnValues: returnValues.join(",")
                }).then(function (result) {
                    return reslove([null, result.Item]);
                }).catch(function (err) {
                    return reslove([new AError(CODES.DB_ERROR, err.stack), null]);
                });
            });
        }
    }, {
        key: "update",
        value: function update(key, updates) {
            var returnValues = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : "UPDATE_NEW";

            var keys = Object.keys(updates);
            var values = Object.values(updates);
            var opts = {
                Key: key,
                UpdateExpression: "set ",
                ExpressionAttributeValues: {},
                ReturnValues: returnValues
            };

            keys.forEach(function (k, index) {
                opts.UpdateExpression += "${key}=:${key} ";
                opts.ExpressionAttributeValues[":${key}"] = updates[k];
                if (index != keys.length - 1) opts.UpdateExpression += "and ";
            });

            return new Promise(function (reslove, reject) {
                thhis.db$("update", opts).then(function (result) {
                    reslove([null, result]);
                }).catch(function (err) {
                    return reslove([new AError(CODES.DB_ERROR, err.stack), null]);
                });
            });
        }
    }, {
        key: "page",
        value: async function page(_ref) {
            var _this3 = this;

            var pageNumber = _ref.pageNumber,
                pageSize = _ref.pageSize,
                _ref$conditions = _ref.conditions,
                conditions = _ref$conditions === undefined ? {} : _ref$conditions,
                _ref$returnValues = _ref.returnValues,
                returnValues = _ref$returnValues === undefined ? [] : _ref$returnValues,
                scanIndexForward = _ref.scanIndexForward,
                indexName = _ref.indexName;

            var page = new Page(pageNumber, pageSize);
            var opts = {
                IndexName: indexName,
                Limit: pageSize,
                ScanIndexForward: scanIndexForward,
                ProjectionExpression: Object.is(returnValues.length, 0) ? "" : returnValues.join(", "),
                KeyConditionExpression: "",
                ExpressionAttributeValues: {}
            };
            var countKeyConditionExpression = "",
                conuntExpressionAttributeValues = {};
            var keys = Object.keys(conditions);
            keys.forEach(function (k, index) {
                var equalMode = " = ",
                    value = conditions[k];
                if (Object.is(_typeof(conditions[k]), "object")) {
                    var pro = conditions[k];
                    for (var key in pro) {
                        switch (key) {
                            case "$gt":
                                equalMode = ">";
                            case "$lt":
                                equalMode = "<";
                            case "$gte":
                                equalMode = ">=";
                            case "$lte":
                                equalMode = "<=";
                            default:
                                break;
                        }
                        value = pro[key];
                        break;
                    }
                } else {
                    countKeyConditionExpression = "" + k + equalMode + ":" + k;
                    conuntExpressionAttributeValues[":" + k] = value;
                }
                opts.KeyConditionExpression += "" + k + equalMode + ":" + k;
                opts.ExpressionAttributeValues[":" + k] = value;
                if (index != keys.length - 1) opts.KeyConditionExpression += " and ";
            });

            var _ref2 = await this.count(countKeyConditionExpression, conuntExpressionAttributeValues),
                _ref3 = _slicedToArray(_ref2, 2),
                countError = _ref3[0],
                count = _ref3[1];

            if (countError) return [countError, page];
            page.setTotal(count);
            return new Promise(function (reslove, reject) {
                _this3.db$("query", opts).then(function (result) {
                    page.setData(result.Items);
                    reslove([null, page]);
                }).catch(function (err) {
                    reslove([new AError(CODES.DB_ERROR, err.stack)], page);
                });
            });
        }
    }, {
        key: "last",
        value: async function last(_ref4) {
            var _this4 = this;

            var skip = _ref4.skip,
                conditions = _ref4.conditions,
                returnValues = _ref4.returnValues,
                indexName = _ref4.indexName,
                lastRecord = _ref4.lastRecord;

            var maxLimit = skip;
            var opts = {
                IndexName: indexName,
                LastEvaluatedKey: lastRecord,
                Limit: skip,
                ProjectionExpression: Object.is(returnValues.length, 0) ? "" : returnValues.join(", "),
                KeyConditionExpression: "",
                ExpressionAttributeValues: {}
            };

            keys.forEach(function (k, index) {
                var equalMode = " = ",
                    value = conditions[k];
                opts.KeyConditionExpression += "" + k + equalMode + ":" + k;
                opts.ExpressionAttributeValues[":" + k] = value;
                if (index != keys.length - 1) opts.KeyConditionExpression += " and ";
            });

            return new Promise(function (reslove, reject) {
                _this4.db$("query", opts).then(function (result) {
                    reslove([null, result.LastEvaluatedKey]);
                }).catch(function (err) {
                    reslove([new AError(CODES.DB_ERROR, err.stack)], null);
                });
            });
        }
    }, {
        key: "count",
        value: function count(filterExpression, expressionAttributeValues) {
            var _this5 = this;

            console.log("count");
            return new Promise(function (reslove, reject) {
                _this5.db$("query", {
                    KeyConditionExpression: filterExpression,
                    ExpressionAttributeValues: expressionAttributeValues,
                    ReturnValues: "username"
                }).then(function (result) {
                    reslove([null, result.Count]);
                }).catch(function (err) {
                    console.log("erroor");
                    console.log(err);
                    reslove([new AError(CODES.DB_ERROR, err.stack), null]);
                });
            });
        }
    }, {
        key: "isExist",
        value: function isExist(key) {
            var _this6 = this;

            return new Promise(function (reslove, reject) {
                _this6.db$("get", { Key: key }).then(function (result) {
                    return reslove(null, result ? true : false);
                }).catch(function (err) {
                    return reslove([new AError(CODES.DB_ERROR, err.stack), null]);
                });
            });
        }
    }, {
        key: "db$",
        value: function db$(action, params) {
            Object.assign(params, { TableName: this.tableName });
            console.log("params");
            console.log(params);
            return this.dbClient[action](params).promise();
        }
    }]);

    return BaseModel;
}();

var Page = function () {
    function Page(pageNumber, pageSize) {
        _classCallCheck(this, Page);

        this.pageNumber = pageNumber;
        this.pageSize = pageSize;
        this.total = 0;
        this.data = [];
    }

    _createClass(Page, [{
        key: "setTotal",
        value: function setTotal(total) {
            this.total = total;
        }
    }, {
        key: "setData",
        value: function setData(data) {
            this.data = data;
        }
    }]);

    return Page;
}();

var Util = exports.Util = function () {
    function Util() {
        _classCallCheck(this, Util);
    }

    _createClass(Util, null, [{
        key: "parseJSON",
        value: function parseJSON(obj) {
            if (Object.is(typeof obj === "undefined" ? "undefined" : _typeof(obj), "object")) return [null, obj];
            try {
                obj = JSON.parse(obj);
                return [null, obj];
            } catch (err) {
                return [new AError(CODES.JSON_FORMAT_ERROR), null];
            }
        }
    }, {
        key: "checkProperty",
        value: function checkProperty(value, type, min, max) {
            if (!value) return [new AError(CODES.JSON_FORMAT_ERROR), null];
            switch (type) {
                case "S":
                    {
                        var strLength = value.length,
                            error = false;
                        if (min && strLength < min) error = true;
                        if (max && strLength > max) error = true;
                        return error ? [new AError(CODES.JSON_FORMAT_ERROR), null] : [null, 0];
                    }
                case "N":
                    {
                        var _parseNumber = this.parseNumber(value),
                            _parseNumber2 = _slicedToArray(_parseNumber, 2),
                            e = _parseNumber2[0],
                            v = _parseNumber2[1];

                        if (e) return [e, 0];
                        var _error = false;
                        if (min && v < min) _error = true;
                        if (max && v > max) _error = true;
                        return _error ? [new AError(CODES.JSON_FORMAT_ERROR), null] : [null, 0];
                    }
                case "J":
                    {
                        return this.parseJSON(value);
                    }
                default:
                    {
                        return [new AError(CODES.INVALID_TYPE), null];
                    }
            }
        }
    }, {
        key: "checkProperties",
        value: function checkProperties(properties, body) {
            var errorArray = [];
            for (var i = 0; i < properties.length; i++) {
                var _properties$i = properties[i],
                    name = _properties$i.name,
                    type = _properties$i.type,
                    min = _properties$i.min,
                    max = _properties$i.max;

                var value = body[name];

                var _checkProperty = this.checkProperty(value, type, min, max),
                    _checkProperty2 = _slicedToArray(_checkProperty, 1),
                    checkErr = _checkProperty2[0];

                if (checkErr) errorArray.push(name);
            }
            return Object.is(errorArray.length, 0) ? [null, errorArray] : [new AError(CODES.JSON_FORMAT_ERROR), errorArray];
        }
    }, {
        key: "parseNumber",
        value: function parseNumber(v) {
            try {
                var value = +v;
                if (Number.isNaN(value)) return [new AError(CODES.JSON_FORMAT_ERROR), null];
                return [null, value];
            } catch (err) {
                return [new AError(CODES.JSON_FORMAT_ERROR), null];
            }
        }
    }]);

    return Util;
}();

var AError = function AError(code, msg) {
    _classCallCheck(this, AError);

    this.code = code;
    this.msg = msg;
    if (!msg) this.msg = EMSG[code.toString()];
};

var CODES = {
    JSON_FORMAT_ERROR: 20000,
    DB_ERROR: 20001,
    INVALID_TYPE: 20002
};

var EMSG = {
    "20000": "parameter type error",
    "20001": "db error",
    "20002": "Invalid type"
};