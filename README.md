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
│   │   ├── todos/           # 待办事项页面
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

```bash
npm run build
npm run start
```
