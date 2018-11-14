### 接口文档

#### 数据库设计
##### 账号 users
- name 姓名 字符串
- pass 密码 字符串 明文保存

##### 动作时间 action_time
- action_id 动作id
- action_update_time 上次更新时间

### api接口
接口基地址 http://api.zhh1995.cn

##### 登录接口
```
url: http://api.zhh1995.cn/user
method: post
请求参数
    name
    pass
返回参数
    msg
    code    0表示成功
备注：如果账号不存在则会自动创建账号
```

##### 上次修改时间接口
```
url: http://api.zhh1995.cn/action
method: post
请求参数
    action_id   动作id
    action_update_time  更新时间，时间戳，精确到秒
返回参数
    code
    msg
备注：更新动作时间

method: get
请求参数
    无
返回参数
    code
    msg
    action_infos
        [action_info, action_info, ...]
        其中action_info
            action_id
            action_update_time
备注：返回所有动作时间信息
```
