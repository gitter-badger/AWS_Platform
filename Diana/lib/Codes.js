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
  NoSuffixError: '50007',
  CodeFullError: '50012',

  Busy: '44004',
  ParamError: '47003',
  IPBlock: '44900',
  SysMaintenance: '44444',
  GameMaintenance: '44445',
  UnAuth: '44002',
  ParamMiss: '44001',
  TokenError: '44000',
  RoleTokenError: '44013',
  UsernameTooLong: '40015',
  UsernameTooShort: '40016',
  PasswordError: '40017',

  AddUserError: '21000',
  DuplicateUser: '21001',
  UserNotFound: '22011',

  TransferError: '10003',
  RepeatTransferError: '11000',
  
  InparamError: '60001',
  CaptchaErr: '60002',
  MerchantPeriodErr: '60003'
}

export const BizErr = {
  JSONParseErr: (errMsg = 'JSON format error') => {
    return { code: Codes.JSONParseError, err: errMsg }
  },
  DBErr: (errMsg = 'DBError') => {
    return { code: Codes.DBError, err: errMsg }
  },
  UserNotFoundErr: (errMsg = '用户未找到') => {
    return { code: Codes.UserNotFound, err: errMsg }
  },
  ParamErr: (errMsg = '参数错误') => {
    return { code: Codes.ParamError, err: errMsg }
  },
  MerchantPeriodErr: (errMsg = '帐号已过期') => {
    return { code: Codes.MerchantPeriodErr, err: errMsg }
  },
  ItemExistErr: (errMsg = '记录已存在') => {
    return { code: Codes.ItemDuplicate, err: errMsg }
  },
  TokenErr: (errMsg = '身份令牌错误') => {
    return { code: Codes.TokenError, err: errMsg }
  },
  RoleTokenErr: (errMsg = '角色身份错误') => {
    return { code: Codes.RoleTokenError, err: errMsg }
  },
  CodeFullError: (errMsg = '所有编号已分配') => {
    return { code: Codes.CodeFullError, err: errMsg }
  },
  InparamErr: (errMsg = '入参错误') => {
    return { code: Codes.InparamError, err: errMsg }
  },
  CaptchaErr: (errMsg = '验证码错误') => {
    return { code: Codes.CaptchaErr, err: errMsg }
  }
}
