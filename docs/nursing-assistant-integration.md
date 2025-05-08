# 护理助手APP集成指南

本文档介绍如何将护理助手APP与职称考试备考平台集成，以及如何在本地环境下进行测试。

## 集成概述

护理助手APP与本平台的集成主要包括以下功能：

1. 护理助手APP用户可以通过APP直接跳转到本平台并自动登录
2. 首次登录的护理助手用户会自动创建平台账户
3. 后续登录会识别护理助手用户并关联到已有账户

## 数据库配置

### 1. 应用迁移脚本

首先需要为数据库添加护理助手用户ID字段：

```bash
# 执行自定义SQL迁移脚本
node scripts/apply-custom-migration.js
```

这将在users表中添加`nursing_assistant_user_id`字段用于关联护理助手APP的用户。

### 2. 环境配置

生产环境需要在`.env`文件中配置MySQL连接信息：

```
# MySQL配置 - 护理助手数据库
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=你的密码
MYSQL_DATABASE=nursing_assistant
```

## 本地测试

为方便本地测试，我们提供了以下工具：

### 1. 模拟护理助手用户数据

本地开发环境使用`src/lib/mock-mysql-connection.ts`模拟护理助手的MySQL数据库。该模块提供了以下预设测试用户：

| 用户ID | 姓名 | 手机号 | 职称 | 医院 |
|-------|-----|-------|-----|-----|
| 1001 | 张三 | 13800000001 | 护士 | 北京协和医院 |
| 1002 | 李四 | 13800000002 | 主管护师 | 上海瑞金医院 |
| 1003 | 王五 | 13800000003 | 护师 | 广州南方医院 |

此外，模拟系统还支持任意数字ID作为有效用户ID，会自动生成用户信息。

### 2. 模拟登录工具

提供了命令行工具用于模拟护理助手APP的登录请求：

```bash
# 运行模拟登录工具
node scripts/simulate-nursing-assistant-login.js
```

这个工具会显示可用的测试用户，并允许您选择一个用户ID或生成随机ID来模拟登录请求。

### 3. URL参数测试

您也可以直接在浏览器中通过URL参数模拟护理助手APP跳转：

```
http://localhost:3000?nursing_assistant_user_id=1001
```

系统将自动检测URL中的`nursing_assistant_user_id`参数并执行登录流程。

## 测试流程

1. 确保应用正在运行：
   ```bash
   npm run dev
   ```

2. 使用上述任一方法进行测试：
   - 运行`node scripts/simulate-nursing-assistant-login.js`
   - 或直接访问带参数的URL`http://localhost:3000?nursing_assistant_user_id=1001`

3. 系统会自动：
   - 验证护理助手用户
   - 创建新用户或关联已有用户
   - 设置登录状态并跳转到个人页面

## 生产环境集成

在生产环境中，护理助手APP将通过以下流程集成：

1. 护理助手APP调用本平台的登录API：`/api/auth/nursing-assistant`
2. 传递用户ID和验证信息
3. 本平台验证用户并返回登录结果
4. 护理助手APP可以通过URL参数方式跳转到本平台：`https://您的域名?nursing_assistant_user_id=用户ID`

## 代码文件说明

- `/src/db/schema/users.ts` - 更新了用户表结构
- `/drizzle/migrations/add_nursing_assistant_user_id.sql` - 数据库迁移SQL
- `/scripts/apply-custom-migration.js` - 执行迁移的脚本
- `/src/lib/mysql-connection.ts` - MySQL数据库连接（生产环境）
- `/src/lib/mock-mysql-connection.ts` - 模拟MySQL连接（开发环境）
- `/src/app/api/auth/nursing-assistant/route.ts` - 护理助手登录API
- `/src/components/shared/NursingAssistantLogin.tsx` - 前端自动登录处理组件
- `/scripts/simulate-nursing-assistant-login.js` - 模拟登录测试工具 