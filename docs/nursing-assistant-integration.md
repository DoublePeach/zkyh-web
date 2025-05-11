# 护理助手APP集成指南

本文档介绍如何将护理助手APP与职称考试备考平台集成，以及如何在本地环境下进行测试。

## 集成概述

护理助手APP与本平台的集成主要包括以下功能：

1. 护理助手APP用户可以通过APP直接跳转到本平台并自动登录
2. 首次登录的护理助手用户会自动创建平台账户
3. 后续登录会识别护理助手用户并关联到已有账户

## 数据库配置

### 1. 应用迁移脚本 (针对本平台PostgreSQL数据库)

首先需要为本平台的PostgreSQL数据库中的`users`表添加护理助手用户ID字段：

```bash
# 此操作通常通过Drizzle ORM的迁移流程完成，
# 如果有特定需要（如旧项目迁移或特殊场景），可能使用自定义脚本。
# 确保你的Drizzle schema (src/db/schema/users.ts) 中包含 nursingAssistantUserId 字段，
# 然后运行标准的迁移命令:
npm run db:generate
npm run db:migrate

# 如果存在并需要运行旧的自定义迁移脚本 (scripts/apply-custom-migration.js)
# node scripts/apply-custom-migration.js 
# (请确认此脚本的当前必要性，Drizzle迁移是标准做法)
```

这将在本平台`users`表中添加`nursing_assistant_user_id`字段用于关联护理助手APP的用户。

### 2. 环境配置 (连接到外部护理助手MySQL数据库)

生产环境需要在`.env`文件中配置连接到**外部护理助手应用的用户数据库 (MySQL)** 的信息，以便查询护理助手用户信息：

```
# MySQL配置 - 护理助手APP的外部用户数据库
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=你的密码
MYSQL_DATABASE=nursing_assistant
```

本平台将使用这些配置通过`mysql2`库连接此外部数据库。

## 本地测试

为方便本地测试，我们提供了以下工具：

### 1. 模拟护理助手用户数据 (外部MySQL)

本地开发环境使用`src/lib/mock-mysql-connection.ts`模拟护理助手APP的外部MySQL数据库连接。该模块提供了以下预设测试用户：

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

您也可以直接在浏览器中通过URL参数模拟护理助手APP跳转（本平台接收此参数进行处理）：

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

1. 护理助手APP调用本平台的登录API：`/api/auth/nursing-assistant` (位于本平台)
2. 传递护理助手用户ID和验证信息到本平台API。
3. 本平台API接收到请求后，会连接到**外部护理助手MySQL数据库**验证用户信息，并根据结果在本平台创建账户/登录或返回错误。
4. 护理助手APP可以通过URL参数方式跳转到本平台：`https://您的域名?nursing_assistant_user_id=用户ID`

## 代码文件说明

- `/src/db/schema/users.ts` - 本平台用户表结构 (PostgreSQL), 包含 `nursing_assistant_user_id`
- `/drizzle/migrations/` - 包含本平台数据库 (PostgreSQL) 的Drizzle ORM迁移文件。 `add_nursing_assistant_user_id.sql` (如果存在)是特定迁移SQL，但通常由`drizzle-kit generate`自动生成。
- `/scripts/apply-custom-migration.js` - 可能的自定义迁移脚本 (检查是否仍必要，或已被Drizzle标准迁移取代)
- `/src/lib/mysql-connection.ts` - 连接到**外部护理助手MySQL数据库**的逻辑 (生产环境)
- `/src/lib/mock-mysql-connection.ts` - 模拟连接到**外部护理助手MySQL数据库**的逻辑 (开发环境)
- `/src/app/api/auth/nursing-assistant/route.ts` - 本平台的护理助手登录API路由
- `/src/components/shared/NursingAssistantLogin.tsx` - 本平台前端处理护理助手自动登录的组件
- `/scripts/simulate-nursing-assistant-login.js` - 模拟护理助手APP登录本平台的测试工具 