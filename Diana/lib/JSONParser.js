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
  const [err, ret] = JSONParse(parsed)
  if (err) {
    throw BizErr.JSONParseErr()
  }
  // 统一输入数据trim处理
  for (let i in ret) {
    if (typeof (ret[i]) == 'string') {
      ret[i] = ret[i].trim()
      if (ret[i] == 'NULL!' || ret[i] == '') {
        ret[i] = null
      }
    }
  }
  delete ret.updatedAt
  return [0, ret]
}
