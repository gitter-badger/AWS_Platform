# Zeus

用户管理模块

# Hera

玩家模块

# Javis

统计模块

# Diana

其他模块

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



#### 通过apiKey 获取token

- URL

```
POST - https://5yg0kn84ng.execute-api.ap-southeast-1.amazonaws.com/dev/users/token
```
- Token Header

```
不需要
```

- Body

```
{
  "username": "merchant002",
  "apiKey": "0c361fab-b5a6-407c-bfa4-1e95a3a944b5",
  "suffix": "YB"
}
```

- Response

```

/*
  成功则返回用户信息以及token
  客户端缓存此token 用作后续请求的认证字段
*/
{
    "m": "grab user token",
    "payload": {
        "username": "YB_merchant002",
        "password": "111111",
        "msn": "957",
        "suffix": "YB",
        "parent": "01",
        "parentName": "PlatformAdmin",
        "userId": "3a06387e-8014-4d76-bb3d-b85d4353e2a4",
        "role": "100",
        "displayName": "0",
        "apiKey": "0c361fab-b5a6-407c-bfa4-1e95a3a944b5",
        "displayId": 853833,
        "updatedAt": 1500320212625,
        "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6IllCX21lcmNoYW50MDAyIiwicGFzc3dvcmQiOiIxMTExMTEiLCJtc24iOiI5NTciLCJzdWZmaXgiOiJZQiIsInBhcmVudCI6IjAxIiwicGFyZW50TmFtZSI6IlBsYXRmb3JtQWRtaW4iLCJ1c2VySWQiOiIzYTA2Mzg3ZS04MDE0LTRkNzYtYmIzZC1iODVkNDM1M2UyYTQiLCJyb2xlIjoiMTAwIiwiZGlzcGxheU5hbWUiOiIwIiwiYXBpS2V5IjoiMGMzNjFmYWItYjVhNi00MDdjLWJmYTQtMWU5NWEzYTk0NGI1IiwiZGlzcGxheUlkIjo4NTM4MzMsInVwZGF0ZWRBdCI6MTUwMDMyMDIxMjYyNSwiaWF0IjoxNTAwMzQxODA1fQ.86Qv1Lyf20TyM3TE1yJtvVpAF6XJlbwTPOyFQRBr0wo"
    },
    "code": "0"
}

/* 错误: 用户未找到 */
{
  "m": "grab user token error"
  "err": {
      "code": "22011",
      "err": "User not found"
  },
  "code": "22011"
}


```
#### 创建系统管理员**

- URL

```
  POST - https://5yg0kn84ng.execute-api.ap-southeast-1.amazonaws.com/dev/beings
```

- Token Header

```
  不需要
```
- Body

```
{
  "username": "Faker001",
  "password": "111111",
  "role": "1",
  "adminName": "Faker"
}
```

- Response

```
{
  "code": 0,
  "payload":{}
}
```

** 部署和测试阶段使用的接口,正式发布版本也不会作为可访问api

#### 创建管理员账号

- URL

```
 POST - https://5yg0kn84ng.execute-api.ap-southeast-1.amazonaws.com/dev/admins
```
- Body

```
{
  "username": "Faker001",
  "password": "111111",
  "role": "1",
  "adminName": "Faker"
}
```
#### 创建线路商 / 商户用户

- URL

```
POST - https://5yg0kn84ng.execute-api.ap-southeast-1.amazonaws.com/dev/users
```

- Token Header

```
  {
    "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIwYTkxNDk5ZS0yN2RiLTRjMzItYTNkYy00MmQyYzNiNjM2YjciLCJ1c2VybmFtZSI6Ik5CX21hbmFnZXIwMDEiLCJwYXJlbnQiOiIzZWZhYjA0Yi05MDY1LTQ4ZTgtOTcwMC03MzA1MjBiMzQzOWMiLCJyb2xlIjoiMTAiLCJkaXNwbGF5SWQiOjE0MDA0MCwiaWF0IjoxNTAwMjA2MTYzfQ.Foo7YiGbXnLgqkJzinfAjiVIvGxZDTWfwao7a05XxK4"
  }
```
- Body

```
/*创建一个直属于平台的商户*/

{
    "username": "merchant002",
    "password": "111111",
    "role": "100",
    "adminName": "Faker002",
    "parent":"01",
    "msn":"957",
    "suffix":"YB"
}
```
- Response

```
/*创建成功,返回账户信息*/
{
    "m": "userNew",
    "payload": {
        "username": "YB_merchant002",
        "password": "111111",
        "msn": "957",
        "suffix": "YB",
        "parent": "01",
        "parentName": "PlatformAdmin",
        "userId": "3a06387e-8014-4d76-bb3d-b85d4353e2a4",
        "role": "100",
        "displayName": "0",
        "apiKey": "0c361fab-b5a6-407c-bfa4-1e95a3a944b5",
        "displayId": 853833,
        "updatedAt": 1500319876115
    },
    "code": "0"
}
```
#### 生成随机管理员密码

- URL

```
POST - https://5yg0kn84ng.execute-api.ap-southeast-1.amazonaws.com/dev/random_password
```

- Response

```
{
    "m": "randomPassword",
    "payload": {
        "generatedPassword": "tinunazovi"
    },
    "code": "0"
}
```
#### 平台管理员 / 线路商 / 商户 登录

- URL

```
POST - https://5yg0kn84ng.execute-api.ap-southeast-1.amazonaws.com/dev/users/auth
```
- Token Header

```
不需要
```
- Body
  - 管理员

  ```
  {
      "username": "Faker001",
      "password": "111111",
      "role": "1"
  }
  ```

  - 线路商

  ```
  {
    "username": "manager001",
    "password": "111111",
    "role": "10",
    "suffix": "NB"
  }
  ```

  - 商户

  ```
  {
    "username": "merchant001",
    "password": "111111",
    "role": "100",
    "suffix": "NB"
  }
  ```

- Response

```
/* 管理员登录的返回  */
{
    "m": "userAuth",
    "payload": {
        "username": "Platform_Faker001",
        "password": "111111",
        "suffix": "Platform",
        "parent": "00",
        "parentName": "SuperAdmin",
        "userId": "eb6d370b-0397-4484-ad09-8c06f27f33fc",
        "role": "1",
        "displayName": "平台管理员",
        "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6IlBsYXRmb3JtX0Zha2VyMDAxIiwicGFzc3dvcmQiOiIxMTExMTEiLCJzdWZmaXgiOiJQbGF0Zm9ybSIsInBhcmVudCI6IjAwIiwicGFyZW50TmFtZSI6IlN1cGVyQWRtaW4iLCJ1c2VySWQiOiJlYjZkMzcwYi0wMzk3LTQ0ODQtYWQwOS04YzA2ZjI3ZjMzZmMiLCJyb2xlIjoiMSIsImRpc3BsYXlOYW1lIjoi5bmz5Y-w566h55CG5ZGYIiwiaWF0IjoxNTAwMzE2NjIzfQ.89GmMwRUsXHa6ki3k_MJiaMOvmB_2iLwF4zZGFmSA3I"
    },
    "code": "0"
}

/*直属商户的返回*/
{
    "m": "userAuth",
    "payload": {
        "username": "YB_merchant002",
        "password": "111111",
        "msn": "957",
        "suffix": "YB",
        "parent": "01",
        "parentName": "PlatformAdmin",
        "userId": "3a06387e-8014-4d76-bb3d-b85d4353e2a4",
        "role": "100",
        "displayName": "0",
        "apiKey": "0c361fab-b5a6-407c-bfa4-1e95a3a944b5",
        "displayId": 853833,
        "updatedAt": 1500320212625,
        "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6IllCX21lcmNoYW50MDAyIiwicGFzc3dvcmQiOiIxMTExMTEiLCJtc24iOiI5NTciLCJzdWZmaXgiOiJZQiIsInBhcmVudCI6IjAxIiwicGFyZW50TmFtZSI6IlBsYXRmb3JtQWRtaW4iLCJ1c2VySWQiOiIzYTA2Mzg3ZS04MDE0LTRkNzYtYmIzZC1iODVkNDM1M2UyYTQiLCJyb2xlIjoiMTAwIiwiZGlzcGxheU5hbWUiOiIwIiwiYXBpS2V5IjoiMGMzNjFmYWItYjVhNi00MDdjLWJmYTQtMWU5NWEzYTk0NGI1IiwiZGlzcGxheUlkIjo4NTM4MzMsInVwZGF0ZWRBdCI6MTUwMDMyMDIxMjYyNSwiaWF0IjoxNTAwMzIwMTgyfQ.DkdFBBtlFXj9fegWaKvfM-3jfI2M5vvJ0oZ7eSVqr_E"
    },
    "code": "0"
}
```

#### 下级建站商列表

- URL

```
GET - https://5yg0kn84ng.execute-api.ap-southeast-1.amazonaws.com/dev/managers
```
- Token Header

```
{
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIwYTkxNDk5ZS0yN2RiLTRjMzItYTNkYy00MmQyYzNiNjM2YjciLCJ1c2VybmFtZSI6Ik5CX21hbmFnZXIwMDEiLCJwYXJlbnQiOiIzZWZhYjA0Yi05MDY1LTQ4ZTgtOTcwMC03MzA1MjBiMzQzOWMiLCJyb2xlIjoiMTAiLCJkaXNwbGF5SWQiOjE0MDA0MCwiaWF0IjoxNTAwMjA2MTYzfQ.Foo7YiGbXnLgqkJzinfAjiVIvGxZDTWfwao7a05XxK4"
}
```
- Query

```
无
```
- Response

```
/* 管理员创建的直属建站商列表 */
{
    "m": "managerList",
    "payload": [
        {
            "lastIP": "171.212.112.96",
            "limit": "10",
            "hostName": "李君",
            "gmUsername": "0",
            "status": 1,
            "contractPeriod": [
                "2017-07-11T16:00:00.000Z",
                "2023-08-10T16:00:00.000Z"
            ],
            "adminName": "就不告诉你",
            "enabledAt": 1500293484080,
            "displayName": "theShy",
            "password": "111111",
            "loginAt": 1500293980329,
            "suffix": "SKT",
            "userId": "52d1e927-6261-43f9-b4f3-4b59ace35795",
            "displayId": 584080,
            "gmPassword": "0",
            "parentName": "PlatformAdmin",
            "hostContact": "13888888888",
            "rate": "90",
            "adminContact": "13111111111",
            "createdAt": 1500293484443,
            "gender": 1,
            "children": 0,
            "remark": "这是一个直属于平台的管理员",
            "managerName": "0",
            "managerEmail": "theShy@skt.com",
            "role": "10",
            "points": "123456",
            "updatedAt": 1500293980329,
            "adminEmail": "unknown@fuck.com",
            "username": "SKT_the_shy001",
            "parent": "01",
            "gameList": [
                "选项3",
                "选项4",
                "选项1"
            ]
        }
    ],
    "code": "0"
}
```


#### 获取某个userId的建站线路商

- URL

```
GET - https://5yg0kn84ng.execute-api.ap-southeast-1.amazonaws.com/dev/managers/{id}
```
- Path Params

```
{
  "id":"52d1e927-6261-43f9-b4f3-4b59ace35795"
}
```
- Response

```
{
    "m": "managerOne",
    "payload": {
        "lastIP": "171.212.112.96",
        "limit": "10",
        "hostName": "李君",
        "gmUsername": "0",
        "status": 1,
        "contractPeriod": [
            "2017-07-11T16:00:00.000Z",
            "2023-08-10T16:00:00.000Z"
        ],
        "adminName": "就不告诉你",
        "enabledAt": 1500293484080,
        "displayName": "theShy",
        "password": "111111",
        "loginAt": 1500343080326,
        "suffix": "SKT",
        "userId": "52d1e927-6261-43f9-b4f3-4b59ace35795",
        "displayId": 584080,
        "gmPassword": "0",
        "parentName": "PlatformAdmin",
        "hostContact": "13888888888",
        "rate": "90",
        "adminContact": "13111111111",
        "passhash": "$2a$10$vU5hUefkAZa7VOTFsiEWA.Fvi1nyYc81oqnySrUfFaqCiwWbVQfuK",
        "createdAt": 1500293484443,
        "gender": 1,
        "children": 0,
        "remark": "这是一个直属于平台的管理员",
        "managerName": "0",
        "managerEmail": "theShy@skt.com",
        "role": "10",
        "points": "123456",
        "updatedAt": 1500343080326,
        "adminEmail": "unknown@fuck.com",
        "parent": "01",
        "username": "SKT_the_shy001",
        "gameList": [
            "选项3",
            "选项4",
            "选项1"
        ]
    },
    "code": "0"
}
```

#### 编辑某个建站线路商

- URL

```
POST - https://5yg0kn84ng.execute-api.ap-southeast-1.amazonaws.com/dev/managers/{id}
```

- Path Params

```
{
  "id": "52d1e927-6261-43f9-b4f3-4b59ace35795"
}
```

- Response

```

```
#### 获取某个商户

- URL

```
GET - https://5yg0kn84ng.execute-api.ap-southeast-1.amazonaws.com/dev/merchants/{id}
```

- Path Params

```
{
  "id":"6409482d-a6b0-4541-9caa-7b25644da4c1"
}
```
- Response

```
{
    "m": "merchantOne",
    "payload": {
        "lastIP": "171.212.112.96",
        "limit": 0,
        "hostName": "liyun",
        "status": 1,
        "merchantName": "0",
        "contractPeriod": [
            "2017-07-17T16:00:00.000Z",
            "2017-08-23T16:00:00.000Z"
        ],
        "adminName": "lijun",
        "enabledAt": 1500350804389,
        "displayName": "Bang",
        "password": "111111",
        "loginAt": 1500350804758,
        "suffix": "SS",
        "userId": "6409482d-a6b0-4541-9caa-7b25644da4c1",
        "displayId": 904389,
        "parentName": "PlatformAdmin",
        "loginWhiteList": "www.google.com",
        "hostContact": "18888888888",
        "apiKey": "adc1fc86-c4fc-4522-9180-527d000e16e2",
        "rate": "10",
        "adminContact": "18888888888",
        "msn": "46",
        "passhash": "$2a$10$52I2mRhlAxesee/eErGtlu9uW1XxEQBmAgivofP6PqU2cGCZXYcym",
        "createdAt": 1500350804758,
        "merchantEmail": "0",
        "gender": 1,
        "children": 0,
        "remark": "nihao",
        "role": "100",
        "points": "10000",
        "updatedAt": 1500350804758,
        "frontURL": "www.gt.com",
        "adminEmail": "lijun@gmail.com",
        "parent": "01",
        "username": "SS_lijun1234",
        "gameList": [
            "真人视讯",
            "电子游戏"
        ]
    },
    "code": "0"
}
```
-
#### 检查给定线路号是否可用

- URL

```
GET - https://5yg0kn84ng.execute-api.ap-southeast-1.amazonaws.com/dev/check_msn/{msn}
```
- Token Header

```
有
```
- Path Params

```
/* 参数在url中 */
{
  "msn":"007"
}
```
- Response

```
/* https://5yg0kn84ng.execute-api.ap-southeast-1.amazonaws.com/dev/check_msn/007 */
/* 线路号 007 未被占用*/
{
    "m": "checkMsn",
    "payload": {
        "avalible": true
    },
    "code": "0"
}

/* https://5yg0kn84ng.execute-api.ap-southeast-1.amazonaws.com/dev/check_msn/957 */
/* 线路号 957 被占有 */
{
    "m": "checkMsn",
    "payload": {
        "avalible": false
    },
    "code": "0"
}
```
#### 获取当前可用的线路商列表  ( 创建线路商或者商户时的可选所属线路商列表 )

- URL

```
GET - https://5yg0kn84ng.execute-api.ap-southeast-1.amazonaws.com/dev/avalible_managers
```
- Response

```
{
    "m": "avalibleManagers",
    "payload": [
        {
            "value": "52d1e927-6261-43f9-b4f3-4b59ace35795",
            "label": "SKT"
        }
    ],
    "code": "0"
}
```

#### 获取下级商户列表

- URL

```
GET - https://5yg0kn84ng.execute-api.ap-southeast-1.amazonaws.com/dev/merchants
```
- Response

```
{
    "m": "merchantList",
    "payload": [
        {
            "lastIP": "218.88.126.54",
            "limit": 0,
            "hostName": "0",
            "status": 1,
            "merchantName": "0",
            "contractPeriod": "0",
            "adminName": "Faker002",
            "enabledAt": 1500319753833,
            "displayName": "0",
            "password": "111111",
            "loginAt": 1500320212625,
            "suffix": "YB",
            "userId": "3a06387e-8014-4d76-bb3d-b85d4353e2a4",
            "displayId": 853833,
            "parentName": "PlatformAdmin",
            "loginWhiteList": [],
            "hostContact": "0",
            "apiKey": "0c361fab-b5a6-407c-bfa4-1e95a3a944b5",
            "rate": 0,
            "adminContact": "0",
            "msn": "957",
            "createdAt": 1500319876115,
            "merchantEmail": "0",
            "gender": 1,
            "children": 0,
            "remark": "0",
            "role": "100",
            "points": 0,
            "updatedAt": 1500320212625,
            "frontURL": "0",
            "adminEmail": "0",
            "username": "YB_merchant002",
            "parent": "01",
            "gameList": []
        }
    ],
    "code": "0"
}
```


#### 新增游戏 **

- URL

```
POST - https://5yg0kn84ng.execute-api.ap-southeast-1.amazonaws.com/dev/games
```
- Body

```
{
  "gameName": "英雄脸萌2",
  "gameRecommend": "我最猛",
  "gameType": "2",
  "gameImg": "http://placehold.it/250x250",
  "gameStatus": "01"
}
```

- Response

```
{
    "m": "gameNew",
    "payload": {},
    "code": "0"
}
```
** 管理客户端没有操作界面

#### 获取游戏列表

- URL

```
GET - https://5yg0kn84ng.execute-api.ap-southeast-1.amazonaws.com/dev/games/{gameType}
```

- Query

```
{
  '0':'TableGame',
  '1':'VideoGame',
  '2':'LiveGame'
}


gameType: '0,2,1'  // 通过传人游戏类型参数来获取游戏列表. 多个游戏类型通过 ',' 分割
```
- Response

```
{
    "m": "gamelist",
    "payload": {
        "Items": [
            {
                "gameName": "英雄脸萌9",
                "gameStatus": "01",
                "updatedAt": 1500342495172,
                "gameImg": "http://placehold.it/250x250",
                "createdAt": 1500342495172,
                "gameType": "0",
                "gameId": "28c89106-6947-4198-8aab-3ef1b8fccb9f",
                "gameRecommend": "我最猛"
            }
        ],
        "Count": 1,
        "ScannedCount": 1
    },
    "code": "0"
}
```


#### 存点

- URL

```
POST - https://5yg0kn84ng.execute-api.ap-southeast-1.amazonaws.com/dev/deposit_points
```

- Token

```
需要
```
- Body

```
/**
存点操作的发起用户从token中获取
**/
  {
    "toRole": "100",
    "toUser": "EDG_clear_love001",
    "amount": 1000.00
  }
```

- Response

```
{
    "m": "depositPoints",
    "payload": {
        "createdAt": 1500473811090,
        "updatedAt": 1500473811090,
        "sn": "1e508aa6-7397-49be-bcd5-4fe0d24f7ba6",
        "fromRole": "10",
        "toRole": "100",
        "fromUser": "TAT_TAT001",
        "toUser": "EDG_clear_love001",
        "action": 0,
        "amount": 1000,
        "operator": "管理员"
    },
    "code": "0"
}


/* 找不到用户错误 */
{
    "m": "depositPoints err",
    "err": {
        "code": "22011",
        "err": "User not found"
    },
    "code": "22011"
}
```

##### 取点

- URL

```
POST - https://5yg0kn84ng.execute-api.ap-southeast-1.amazonaws.com/dev/withdraw_points
```

- Body

```
/**
取点操作的发起用户从token中获取
**/
  {
    "toRole": "100",
    "toUser": "EDG_clear_love001",
    "amount": 1000.00
  }

```

- Response

```
{
    "m": "withdrawPoints",
    "payload": {
        "createdAt": 1500474814342,
        "updatedAt": 1500474814342,
        "sn": "297315d0-3c2f-4f13-9c5e-b2455d7438fc",
        "fromRole": "10",
        "toRole": "100",
        "fromUser": "TAT_TAT001",
        "toUser": "EDG_clear_love001",
        "action": 1,
        "amount": 1000,
        "operator": "管理员"
    },
    "code": "0"
}

/* 找不到用户错误 */
{
    "m": "withdrawPoints err",
    "err": {
        "code": "22011",
        "err": "User not found"
    },
    "code": "22011"
}
```
#### 查询某个用户的点数余额

- URL

```
 GET - https://5yg0kn84ng.execute-api.ap-southeast-1.amazonaws.com/dev/bills/{userId}
```

- Path Params

```
{
  "userId": "e116fce7-cc24-4262-91fe-f7d7e93b5995"
}
```

- Token

```
需要
只能是管理员账号 或者是该用户本人
```

- Response

```
{
    "payload": {
        "balance": 200000,
        "userId": "e116fce7-cc24-4262-91fe-f7d7e93b5995"
    },
    "code": "0"
}



```
