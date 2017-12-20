# 文档已经迁移到TAPD

[![Join the chat at https://gitter.im/AWS_Platform/Lobby](https://badges.gitter.im/AWS_Platform/Lobby.svg)](https://gitter.im/AWS_Platform/Lobby?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

##首先设置TOKEN密钥
aws ssm put-parameter --name TOKEN_SECRET --value *** --type SecureString

##查看已设置密钥
aws ssm describe-parameters