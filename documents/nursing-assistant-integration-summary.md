# 护理助手APP集成指南摘要

本文档是 `docs/nursing-assistant-integration.md` 的摘要。

## 集成概述
该文档详细说明了如何将护理助手APP与本职称考试备考平台进行集成，核心目标是实现用户数据的互通和单点登录。

**主要集成功能：**
1.  护理助手APP用户可直接跳转至本平台并自动完成登录。
2.  首次登录的护理助手用户，本平台会为其自动创建账户（或关联），并在验证其在外部护理助手数据库中的信息后完成。
3.  后续登录会识别护理助手用户并关联到本平台的已有账户。

## 数据库配置
*   **本平台数据库 (PostgreSQL):** `users`表中添加 `nursing_assistant_user_id` 字段。此变更通过Drizzle ORM标准迁移流程管理。
*   **外部护理助手用户数据库 (MySQL):** 需在 `.env` 文件中配置连接此外部MySQL数据库的信息，用于本平台API查询和验证护理助手用户信息。 (`MYSQL_HOST`, `MYSQL_USER`, etc.)

## 本地测试与模拟
*   **模拟外部MySQL连接:** `src/lib/mock-mysql-connection.ts` 用于模拟外部护理助手MySQL数据库的连接和数据。
*   **模拟登录工具:** `scripts/simulate-nursing-assistant-login.js` 用于模拟护理助手APP发起的登录请求到本平台。
*   **URL参数测试:** 可通过 `http://localhost:3000?nursing_assistant_user_id=XXXX` 直接测试本平台的处理逻辑。

## 测试流程指引
1.  启动本平台应用 (`npm run dev`)。
2.  使用模拟登录工具或URL参数发起测试。
3.  本平台系统将自动：验证护理助手用户（可能涉及查询外部MySQL模拟数据），创建/关联本平台用户，设置登录状态并跳转。

## 生产环境集成流程
1.  护理助手APP调用本平台的API `/api/auth/nursing-assistant/route.ts`。
2.  传递护理助手用户ID和验证信息。
3.  本平台API接收请求，连接到**外部护理助手MySQL数据库**验证用户，然后处理本平台的用户创建/登录。
4.  护理助手APP通过URL参数 (`https://您的域名?nursing_assistant_user_id=用户ID`) 将用户跳转到本平台。

## 涉及的关键代码文件 (本平台)
*   `src/db/schema/users.ts`: 定义本平台用户表 (含 `nursing_assistant_user_id`)。
*   `drizzle/migrations/`: Drizzle ORM迁移文件 (PostgreSQL)。
*   `src/lib/mysql-connection.ts`: 连接外部护理助手MySQL数据库的逻辑。
*   `src/lib/mock-mysql-connection.ts`: 模拟连接外部MySQL的逻辑。
*   `src/app/api/auth/nursing-assistant/route.ts`: 护理助手登录API路由。
*   `src/components/shared/NursingAssistantLogin.tsx`: 前端自动登录处理组件。
*   `scripts/simulate-nursing-assistant-login.js`: 模拟登录测试工具。

详情请查阅原始文档 `docs/nursing-assistant-integration.md`。 