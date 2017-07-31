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
  JSONParseErr: (errMsg = 'JSON format error') => {
    return {code: Codes.JSONParseError, err: errMsg}
  },
  DBErr: (errMsg = 'DBError') => {
    return {code: Codes.DBError, err: errMsg}
  },
  UsernameTooShortErr: (errMsg = 'User name too short') => {
    return {code: Codes.UsernameTooShort, err: errMsg}
  },
  UsernameTooLongErr: (errMsg = 'User name too long') => {
    return {code: Codes.UsernameTooLong, err: errMsg}
  },
  UserExistErr: (errMsg = 'User already exist') => {
    return {code: Codes.DuplicateUser, err: errMsg}
  },
  UserNotFoundErr:(errMsg = 'User not found') => {
    return {code:Codes.UserNotFound,err:errMsg}
  },
  UserLockedErr:(errMsg = 'User locked') => {
    return {code:Codes.UserLocked,err:errMsg}
  },
  PasswordErr:(errMsg = 'password error') => {
    return {code:Codes.PasswordError,err:errMsg}
  },
  ParamMissErr: (errMsg = 'params missing') => {
    return {code: Codes.ParamMiss, err: errMsg}
  },
  ParamErr: (errMsg = 'params error') => {
    return {code: Codes.ParamError, err: errMsg}
  },
  NoSuffixErr: (errMsg = 'no suffix error')=>{
    return {code:Codes.NoSuffixError,err:errMsg}
  },
  MerchantPeriodEndErr: (errMsg = '帐号已过期') => {
    return {code: Codes.MerchantPeriodErr, err: errMsg}
  },
  MerchantPeriodStartErr: (errMsg = '帐号尚未生效') => {
    return {code: Codes.MerchantPeriodErr, err: errMsg}
  },
  ItemExistErr: (errMsg = 'data item is exist')=>{
    return {code:Codes.ItemDuplicate,err:errMsg}
  },
  TokenErr: (errMsg= 'Token error') =>{
    return {code:Codes.TokenError,err:errMsg}
  },
  MsnExistErr: (errMsg = 'MSN number is exist') =>{
    return {code:Codes.MsnExistError,err:errMsg}
  },
  MsnUsedError: (errMsg = 'MSN is used') =>{
    return {code:Codes.MsnUsedError,err:errMsg}
  },
  MsnNotExistError: (errMsg = 'MSN is used') =>{
    return {code:Codes.MsnNotExistError,err:errMsg}
  },
  MsnFullError: (errMsg = 'MSN full') =>{
    return {code:Codes.MsnFullError,err:errMsg}
  },
  InsufficientBalanceErr: (errMsg = 'InsufficientBalance') => {
    return {code: Codes.InsufficientBalance,err:errMsg}
  },
  InparamErr: (errMsg = 'InparamError') => {
    return  {code : Codes.InparamError, err: errMsg}
  },
  CaptchaErr: (errMsg = 'CaptchaErr') => {
    return  {code : Codes.CaptchaErr, err: errMsg}
  }
}
