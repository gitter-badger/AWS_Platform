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

```
  5yg0kn84ng.execute-api.ap-southeast-1
```

这部分在每个部署节点上是不同的. 请作为可变配置处理

## 创建系统管理员

- URL

```
  POST  https://5yg0kn84ng.execute-api.ap-southeast-1.amazonaws.com/dev/beings
```

- body

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
