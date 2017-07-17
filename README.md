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

1. API的域名在每个部署节点上是不同的. 请作为可变配置处理.
```
  5yg0kn84ng.execute-api.ap-southeast-1
```






#### 创建系统管理员

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

部署和测试阶段使用的接口,正式发布版本也不会作为可访问api


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
{
  "displayName": "建站商001",
  "adminName": "李君",
  "username": "manager001",
  "password": "111111",
  "role": "10",
  "suffix": "NB",
  "parent": "7604b5d7-22ae-4334-a778-0a47d4ad9022"
}
```
- Response


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
```
