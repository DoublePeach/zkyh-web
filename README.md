# NextJS全栈Web应用

这是一个使用NextJS、Drizzle ORM和PostgreSQL构建的全栈Web应用。

## 技术栈

- **前端**：NextJS, React, TailwindCSS
- **后端**：NextJS API路由
- **数据库**：PostgreSQL
- **ORM**：Drizzle ORM
- **开发工具**：TypeScript, ESLint

## 功能特点

- 现代化的UI设计
- 全栈TypeScript支持
- 使用Drizzle ORM进行类型安全的数据库操作
- 待办事项的增删改查功能示例
- 用户管理API示例

## 开始使用

### 前提条件

- Node.js 18+ 
- PostgreSQL数据库

### 安装步骤

1. 克隆项目:
   ```bash
   git clone <repository-url>
   cd zkyh-web
   ```

2. 安装依赖:
   ```bash
   npm install
   ```

3. 环境配置:
   创建`.env`文件，并添加必要的环境变量：
   ```
   DATABASE_URL=postgresql://postgres:password@localhost:5432/zkyh_db
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

4. 数据库迁移:
   ```bash
   npm run db:generate
   npm run db:migrate
   ```

5. 启动开发服务器:
   ```bash
   npm run dev
   ```

6. 打开浏览器访问 [http://localhost:3000](http://localhost:3000)

## 数据库管理

- 生成迁移文件: `npm run db:generate`
- 应用迁移: `npm run db:migrate`
- 启动Drizzle Studio: `npm run db:studio`

## 项目结构

```
zkyh-web/
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── api/             # API路由
│   │   ├── page.tsx         # 首页
│   │   └── layout.tsx       # 全局布局
│   ├── db/                  # 数据库相关
│   │   ├── schema.ts        # 数据表定义
│   │   ├── index.ts         # 数据库连接
│   │   └── migrate.ts       # 迁移脚本
├── drizzle/                 # Drizzle迁移文件
├── public/                  # 静态资源
├── drizzle.config.ts        # Drizzle配置
└── package.json             # 项目依赖和脚本
```

## 开发

- **添加新表**: 在`src/db/schema.ts`中定义新的表结构
- **添加新API**: 在`src/app/api`目录下创建新的API路由
- **前端页面**: 在`src/app`目录下创建新的页面组件

## 部署

应用可以部署到支持NextJS的平台，如Vercel或自托管的服务器。

## 环境变量配置

项目使用环境变量来集中管理敏感配置信息。创建一个`.env`文件（不包含在版本控制中）来存储这些变量。

```bash
# 环境设置
NODE_ENV=development

# 数据库连接字符串 - 使用其中一个
# 生产环境数据库
DATABASE_URL=postgresql://postgres:3333@124.220.178.188:5432/zkyh_db
# 开发环境数据库
DEV_DATABASE_URL=postgresql://postgres@localhost:5432/zkyh_db1

# 生产环境数据库参数
PG_HOST=124.220.178.188
PG_PORT=5432
PG_USER=postgres
PG_PASSWORD=3333
PG_DATABASE=zkyh_db

# 开发环境数据库参数
PG_DEV_HOST=localhost
PG_DEV_PORT=5432
PG_DEV_USER=postgres
PG_DEV_PASSWORD=
PG_DEV_DATABASE=zkyh_db1

# AI配置
OPENROUTER_API_KEY=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
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
DEFAULT_MODEL=anthropic/claude-3-opus:beta

# MCP配置
SMITHERY_API_KEY=905a415a-4a92-4589-a5cd-640ad2ce3020
MCP_SERVER_URL=https://server.smithery.ai/@gldc/mcp-postgres
```

### 环境变量说明

- `NODE_ENV`: 设置当前环境 (`development` 或 `production`)
- 数据库连接字符串:
  - `DATABASE_URL`: 生产环境数据库连接字符串
  - `DEV_DATABASE_URL`: 开发环境数据库连接字符串
- 数据库参数:
  - 生产环境: `PG_HOST`, `PG_PORT`, `PG_USER`, `PG_PASSWORD`, `PG_DATABASE`
  - 开发环境: `PG_DEV_HOST`, `PG_DEV_PORT`, `PG_DEV_USER`, `PG_DEV_PASSWORD`, `PG_DEV_DATABASE`

### 检查数据库配置

可以运行以下命令来验证当前的数据库配置:

```bash
node scripts/check-db-config.js
```

## 开发相关
