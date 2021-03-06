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
  "13007" : "购买的不是道具"
}


export class CHeraErr{
  constructor(code){
    this.code = code;
    this.msg = errorMessage[code.toString()];
  }
}
