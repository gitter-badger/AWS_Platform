// Biz Codes defines
export const Codes = {
  OK: '0',
  Error: '-1',
  DBError: '50001',
  InputError: '50002',
  ItemNotFound: '50003',
  ItemDuplicate: '50004',
  BizError: '50005',
  JSONParseError: '50006',
  NoSuffixError:'50007',
  MsnExistError: '50008',
  MsnUsedError: '50009',
  MsnNotExistError: '50010',
  MsnFullError: '50011',
  Busy: '44004',
  ParamError: '47003',
  IPBlock: '44900',
  SysMaintenance: '44444',
  GameMaintenance: '44445',
  UnAuth: '44002',
  ParamMiss: '44001',
  TokenError: '44000',
  UsernameTooLong: '40015',
  UsernameTooShort: '40016',
  PasswordError: '40017',
  AddUserError: '21000',
  DuplicateUser: '21001',
  UserNotFound: '22011',
  UserLocked: '22012',
  InsufficientBalance: '10002',
  TransferError: '10003',
  RepeatTransferError: '11000',
  InparamError: '60001',
  CaptchaErr: '60002',
  MerchantPeriodStartErr: '60003',
  MerchantPeriodEndErr: '60004'
}

export const BizErr = {
  JSONParseErr: (errMsg = 'JSON转换错误，请检查入参JSON格式') => {
    return {code: Codes.JSONParseError, err: errMsg}
  },
  DBErr: (errMsg = 'DBError') => {
    return {code: Codes.DBError, err: errMsg}
  },
  UsernameTooShortErr: (errMsg = '用户名太短') => {
    return {code: Codes.UsernameTooShort, err: errMsg}
  },
  UsernameTooLongErr: (errMsg = '用户名太长') => {
    return {code: Codes.UsernameTooLong, err: errMsg}
  },
  UserExistErr: (errMsg = '用户已存在') => {
    return {code: Codes.DuplicateUser, err: errMsg}
  },
  UserNotFoundErr:(errMsg = '用户未找到') => {
    return {code:Codes.UserNotFound,err:errMsg}
  },
  UserLockedErr:(errMsg = '用户已锁定') => {
    return {code:Codes.UserLocked,err:errMsg}
  },
  PasswordErr:(errMsg = '密码错误') => {
    return {code:Codes.PasswordError,err:errMsg}
  },
  ParamMissErr: (errMsg = '参数缺失') => {
    return {code: Codes.ParamMiss, err: errMsg}
  },
  ParamErr: (errMsg = '参数错误') => {
    return {code: Codes.ParamError, err: errMsg}
  },
  NoSuffixErr: (errMsg = '缺少前缀')=>{
    return {code:Codes.NoSuffixError,err:errMsg}
  },
  MerchantPeriodEndErr: (errMsg = '帐号已过期') => {
    return {code: Codes.MerchantPeriodErr, err: errMsg}
  },
  MerchantPeriodStartErr: (errMsg = '帐号尚未生效') => {
    return {code: Codes.MerchantPeriodErr, err: errMsg}
  },
  ItemExistErr: (errMsg = '记录已存在')=>{
    return {code:Codes.ItemDuplicate,err:errMsg}
  },
  TokenErr: (errMsg= '身份令牌错误') =>{
    return {code:Codes.TokenError,err:errMsg}
  },
  MsnExistErr: (errMsg = '线路号已存在') =>{
    return {code:Codes.MsnExistError,err:errMsg}
  },
  MsnUsedError: (errMsg = '线路号已占用') =>{
    return {code:Codes.MsnUsedError,err:errMsg}
  },
  MsnNotExistError: (errMsg = '线路号不存在') =>{
    return {code:Codes.MsnNotExistError,err:errMsg}
  },
  MsnFullError: (errMsg = '线路号已全部分配') =>{
    return {code:Codes.MsnFullError,err:errMsg}
  },
  InsufficientBalanceErr: (errMsg = 'InsufficientBalance') => {
    return {code: Codes.InsufficientBalance,err:errMsg}
  },
  InparamErr: (errMsg = '入参错误') => {
    return  {code : Codes.InparamError, err: errMsg}
  },
  CaptchaErr: (errMsg = '验证码错误') => {
    return  {code : Codes.CaptchaErr, err: errMsg}
  }
}
