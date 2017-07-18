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
{
    "m": "managerList",
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


#### 创建线路商 / 商户用户

- URL

```
POST - https://5yg0kn84ng.execute-api.ap-southeast-1.amazonaws.com/dev/users
```

- Token Header

```
  {
    "Authoriztion": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIwYTkxNDk5ZS0yN2RiLTRjMzItYTNkYy00MmQyYzNiNjM2YjciLCJ1c2VybmFtZSI6Ik5CX21hbmFnZXIwMDEiLCJwYXJlbnQiOiIzZWZhYjA0Yi05MDY1LTQ4ZTgtOTcwMC03MzA1MjBiMzQzOWMiLCJyb2xlIjoiMTAiLCJkaXNwbGF5SWQiOjE0MDA0MCwiaWF0IjoxNTAwMjA2MTYzfQ.Foo7YiGbXnLgqkJzinfAjiVIvGxZDTWfwao7a05XxK4"
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
  "Authoriztion": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIwYTkxNDk5ZS0yN2RiLTRjMzItYTNkYy00MmQyYzNiNjM2YjciLCJ1c2VybmFtZSI6Ik5CX21hbmFnZXIwMDEiLCJwYXJlbnQiOiIzZWZhYjA0Yi05MDY1LTQ4ZTgtOTcwMC03MzA1MjBiMzQzOWMiLCJyb2xlIjoiMTAiLCJkaXNwbGF5SWQiOjE0MDA0MCwiaWF0IjoxNTAwMjA2MTYzfQ.Foo7YiGbXnLgqkJzinfAjiVIvGxZDTWfwao7a05XxK4"
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
