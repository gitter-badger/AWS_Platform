# Zeus
用户管理模块<br>
**接口文档地址：https://documenter.getpostman.com/view/2425376/zeus/6fePLbS**
# Diana
其他模块（日志，厂商，游戏，订单）<br>
**接口文档地址：https://documenter.getpostman.com/view/2425376/diana/6mxacXa**
# Hera
玩家模块<br>
**接口文档地址：**
# Javis
统计模块<br>
**接口文档地址：**

# API
**注意:**
API的域名在每个部署节点上是不同的.( [ hostName ] 和 [ stage ] ). 请作为可变配置处理.
```
  https://[hostName]/[stage]/[resouces]
```

#### 错误码定义
```
/* 在请求的Response里面的code字段 一定包含如下编码之一 */
{
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
```