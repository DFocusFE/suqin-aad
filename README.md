# suqin-aad

> [suqin](https://github.com/DFocusFE/suqin)的一款插件, 使其支持Azure AD账号体系的通讯录操作.

## 主要功能

- 对`Group`的增删改查操作
- 对`User`的增删改查操作, 该资源在API中使用`member`进行描述

## API列表

### read API

- 查询成员列表`readMembers`
- 查询成员详情`readMember`
- 校验用户是否存在`verifiyMember`
- 查询群组列表`readGroups`
- 查询群组详情`readGroup`
- 查询指定用户所属部门`readMemberBelong`

### write API

- 创建成员`createMember`
- 删除成员`deleteMember`
- 修改成员`updateMember`
- 创建群组`createGroup`
- 删除群组`deleteGroup`
- 修改群组`updateGroup`
- 添加群组成员`addGroupMember`
- 删除群组成员`deleteGroupMember`

## 使用方法

```js
const Suqin = require('suqin');
const AAD = require('suqin-aad');

const directories = new Suqin();

const opts = {
  tenlentId: 'your tenlentId',
  clientId: 'your clientId',
  userName: 'your userName',
  userPassword: 'your userPassword',
  baseUrl: 'chinacloudapi.cn',
  name: 'AAD',
};

const azureAD = new AAD(opts);

directories.use(azureAD);

// member为您要创建的成员, 其数据结构请参考AzureAD Graph API reference
directories.createMember('AAD', member)
  .then(res => res.data, err => err.data);

directories.readMembers('AAD')
  .then(res => res.data, err => err.data);
```

## 注意事项

- 全部代码使用ES6进行编写, 您可能需要babel的协助
- 推荐使用Node.js>=8.0进行开发, 否则可能需要使用`babel`进行转译或者使用`--harmony`模式来执行本程序
- 执行测试时请先行配置以下环境变量
  - `AAD_TENLENT_ID` Azure AD 租户ID
  - `AAD_CLIENT_ID` Azure AD 应用客户端ID
  - `AAD_USER_NAME` Azure AD 用户名
  - `AAD_USER_PASSWORD` Azure AD 用户密码
  - `AAD_BASE_URL` Azure AD Graph API 主域
  - `AAD_NAME` 本插件在suqin体系内的注册名

## 参考资料

- [Azure AD Graph API reference](https://msdn.microsoft.com/Library/Azure/Ad/Graph/api/api-catalog)
