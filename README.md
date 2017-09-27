# 文档已经迁移到TAPD

##首先设置TOKEN密钥
aws ssm put-parameter --name TOKEN_SECRET --value *** --type SecureString

##查看已设置密钥
aws ssm describe-parameters