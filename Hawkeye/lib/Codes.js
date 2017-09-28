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
    TokenExpire : 90001, //token过期

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
  "15000" : "游戏key错误",
  "90001" : "TOKEN已过期"
}


export class CHeraErr{
  constructor(code){
    this.code = code || -1;
    this.msg = errorMessage[code.toString()];
  }
}
