// Biz Codes defines
export const CODES = {
    OK : 0,
    SystemError : 500,
    JSONParseError : 10000,
    DataError : 10000,
    merchantNotExist : 10001,
    apiKeyOrSuffixError : 10002,
    userAlreadyRegister : 10003,
    userNotExist : 10004,
    passwordError : 10005,
    Frozen : 10006,
    merBalIns : 10007,
    palyerIns : 10008,
    TokenError : 11000,
    gameingError : 11001, //正在游戏中，不能转账

    playerRecordError : { //账单数据错误
      depositErr : 12000, //存点不正确
      takeErr : 12001,   //取点不正确
      billNotMatchErr : 12002, //账单不匹配
      notSingleUser : 12003,  //不是同一个用户提交
      notHaveRecord : 12004,  //没有记录
    },
    toolNotExist : 13000,  //道具不存在
    amountError : 13001,   //金额不正确
    gameNotExist : 13002,  //游戏不存在
    seatNotExist : 13003, //展位不存在
    packageNotExist : 13004, //道具包不存在
    notDiamonds : 13005,   //不是N币包
    DiamondsIns : 13006,   //N币不足
    notPros : 13007,   //不是道具包

    noticeNotExist : 13100, //公告不存在
    notAuth : 13101,  //没有权限
    toolNotExist : 13102, //道具不存在
    toolMoreThan : 13103,  //道具超过12个
    emailNotExist : 13104, //邮件不存在
    emailUpdateError:13105,  //邮件已经发送，不能修改
    emailAlreadyAcceptError:13106,  //该邮件已经领取

    AgentNotExist : 14000,  //代理不存在
    NotAuth : 14001,  //没有权限
    AgentBalanceIns : 14002, //代理点数不足
    nicknameAlreadyExist : 14003,  //昵称已存在
    mixError : 14004,//洗码比有误
    gameKeyError : 15000, //游戏key错误
}

const errorMessage = {
  "500" : "服务器错误",
  "10000" : "数据错误",
  "10001" : "商家不存在",
  "10002" : "apiKey错误",
  "10003" : "用户已注册",
  "10004" : "用户不存在",
  "10005" : "密码错误",
  "10006" : "账号已冻结",
  "11000" : "token错误",
  "10007" : "商家点数不足",
  "10008" : "玩家点数不足",
  "10009" : "无效的请求IP",
  "11001" : "玩家正在游戏中",
  "12000" : "存点不正确",
  "12001" : "取点不正确",
  "12002" : "账单不匹配",
  "notSingleUser" : "不是同一个用户提交",
  "12004" : "记录不存在",
  "13000" : "道具不存在",
  "13001" : "金额不正确",
  "13002" : "游戏不存在",
  "13003" : "展位不存在",
  "13004" : "道具包不存在",
  "13005" : "购买的不是N币",
  "13006" : "N币不足",
  "13007" : "购买的不是道具",
  "13100" : "公告不存在",
  "13101" : "没有权限",
  "13102" : "道具不存在",
  "13103" : "道具超过12个",
  "13104" : "邮件不存在",
  "13105" : "邮件已经发送，不能修改",
  "13106" : "该邮件已经领取",
   "14000" : "代理不存在",
  "14001" : "你没有权限",
  "14002" : "你的点数不足",
  "14003" : "昵称已存在",
  "14004" : "洗码比有误",
  "15000" : "游戏key错误"
}


export class CHeraErr{
  constructor(code){
    this.code = code || -1;
    this.msg = errorMessage[code.toString()];
  }
}

// 错误方案二
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
  MsnExistError: '50008',
  MsnUsedError: '50009',
  MsnNotExistError: '50010',
  MsnFullError: '50011',
  CodeFullError: '50012',
  BalanceError: '50013',
  NickExistError: '50014',

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
  UserLocked: '22012',
  UserIPError: '22013',

  InsufficientBalance: '10002',
  TransferError: '10003',
  RepeatTransferError: '11000',
  InparamError: '60001',
  CaptchaErr: '60002',

  MerchantPeriodStartErr: '60003',
  MerchantPeriodEndErr: '60004',
  TcpError: '60004',
  CompanyNotExistError: "60005",
  PushMerchantError: "60006",
  HttpsError: '60007',

  TokenExpire: '90001',
}
export const BizErr = {
  JSONParseErr: (errMsg = 'JSON转换错误，请检查入参JSON格式') => {
    return { code: Codes.JSONParseError, msg: errMsg }
  },
  DBErr: (errMsg = 'DBError') => {
    return { code: Codes.DBError, msg: errMsg }
  },
  UserExistErr: (errMsg = '用户已存在') => {
    return { code: Codes.DuplicateUser, msg: errMsg }
  },
  NickExistErr: (errMsg = '昵称已存在') => {
    return { code: Codes.NickExistError, msg: errMsg }
  },
  UserNotFoundErr: (errMsg = '用户未找到') => {
    return { code: Codes.UserNotFound, msg: errMsg }
  },
  UserLockedErr: (errMsg = '用户已锁定') => {
    return { code: Codes.UserLocked, msg: errMsg }
  },
  UserIPErr: (errMsg = '登录IP未在白名单范围内') => {
    return { code: Codes.UserIPError, msg: errMsg }
  },
  PasswordErr: (errMsg = '密码错误') => {
    return { code: Codes.PasswordError, msg: errMsg }
  },
  ParamMissErr: (errMsg = '参数缺失') => {
    return { code: Codes.ParamMiss, msg: errMsg }
  },
  ParamErr: (errMsg = '参数错误') => {
    return { code: Codes.ParamError, msg: errMsg }
  },
  NoSuffixErr: (errMsg = '缺少前缀') => {
    return { code: Codes.NoSuffixError, msg: errMsg }
  },
  MerchantPeriodEndErr: (errMsg = '帐号已过期') => {
    return { code: Codes.MerchantPeriodEndErr, msg: errMsg }
  },
  MerchantPeriodStartErr: (errMsg = '帐号尚未生效') => {
    return { code: Codes.MerchantPeriodStartErr, msg: errMsg }
  },
  ItemExistErr: (errMsg = '记录已存在') => {
    return { code: Codes.ItemDuplicate, msg: errMsg }
  },
  TokenErr: (errMsg = '身份令牌错误') => {
    return { code: Codes.TokenError, msg: errMsg }
  },
  RoleTokenErr: (errMsg = '角色身份错误') => {
    return { code: Codes.RoleTokenError, msg: errMsg }
  },
  MsnExistErr: (errMsg = '线路号已存在') => {
    return { code: Codes.MsnExistError, msg: errMsg }
  },
  MsnUsedError: (errMsg = '线路号已占用') => {
    return { code: Codes.MsnUsedError, msg: errMsg }
  },
  MsnNotExistError: (errMsg = '线路号不存在') => {
    return { code: Codes.MsnNotExistError, msg: errMsg }
  },
  MsnFullError: (errMsg = '线路号已全部分配') => {
    return { code: Codes.MsnFullError, msg: errMsg }
  },
  CodeFullError: (errMsg = '所有编号已分配') => {
    return { code: Codes.CodeFullError, msg: errMsg }
  },
  InsufficientBalanceErr: (errMsg = 'InsufficientBalance') => {
    return { code: Codes.InsufficientBalance, msg: errMsg }
  },
  InparamErr: (errMsg = '入参错误') => {
    return { code: Codes.InparamError, msg: errMsg }
  },
  CaptchaErr: (errMsg = '验证码错误') => {
    return { code: Codes.CaptchaErr, msg: errMsg }
  },
  CaptchaErr: (errMsg = '验证码错误') => {
    return { code: Codes.CaptchaErr, msg: errMsg }
  },
  BalanceErr: (errMsg = '余额不足') => {
    return { code: Codes.BalanceError, msg: errMsg }
  },
  TcpErr: (errMsg = 'tcp connection error') => {
    return { code: Codes.TcpError, msg: errMsg }
  },
  HttpsErr: (errMsg = '请求游戏服务器后台失败') => {
    return { code: Codes.HttpsError, msg: errMsg }
  },
  CompanyNotExistError: (errMsg = "游戏厂商不存在") => {
    return { code: Codes.CompanyNotExistError, msg: errMsg }
  },
  PushMerchantError: (errMsg = "推送商户错误") => {
    return { code: Codes.PushMerchantError, msg: errMsg }
  },
  TokenExpire: (errMsg = 'TOKEN已过期') => {
    return { code: Codes.TokenExpire, msg: errMsg }
  }
}