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
  InsufficientBalance: '10002',
  TransferError: '10003',
  RepeatTransferError: '11000'
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
  ParamMissErr: (errMsg = 'params missing') => {
    return {code: Codes.ParamMiss, err: errMsg}
  },
  ParamErr: (errMsg = 'params error') => {
    return {code: Codes.ParamError, err: errMsg}
  },
  NoSuffixErr: (errMsg = 'no suffix error')=>{
    return {code:Codes.NoSuffixError,err:errMsg}
  },
  ItemExistErr: (errMsg = 'data item is exist')=>{
    return {code:Codes.ItemDuplicate,err:errMsg}
  },
  TokenErr: (errMsg= '403 no token') =>{
    return {code:Codes.TokenError,err:errMsg}
  }
}
