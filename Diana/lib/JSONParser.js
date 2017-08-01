const JSONParse = require('safe-json-parse/tuple')

import _ from 'lodash'
import { BizErr } from './Codes'
// JSONParser
export const JSONParser = (data) => {
  const parsed = _.isString(data)
    ? data
    : (_.isObject(data)
      ? JSON.stringify(data)
      : '')
  const [err,ret] = JSONParse(parsed)
  if (err) {
    return [BizErr.JSONParseErr(),0]
  }
  // 统一输入数据trim处理
  for(let i in ret){
    if(typeof(ret[i]) == 'string'){
      ret[i] = ret[i].trim()
    }
  }
  return [0,ret]
}
export const Trim = _.trim
export const Empty = _.isEmpty
export const Pick = _.pick
export const Omit = _.omit
export const Keys = _.keys
