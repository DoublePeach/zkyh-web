# 项目概述及需求规范摘要

本文档是项目根目录下 `README.md` 主要内容的摘要。

## 第一部分：项目（智考引航）基本信息

*   **项目名称：** 智考引航
*   **描述：** 一个使用 NextJS、Drizzle ORM 和 PostgreSQL 构建的全栈 Web 应用。
*   **技术栈：**
    *   前端：NextJS (v15.3.1), React (v19), TailwindCSS (v4), Shadcn UI, Lucide Icons
    *   状态管理与数据获取：Zustand (v5), React Query (v5), SWR (v2)
    *   表单处理：React Hook Form (v7), Zod (v3)
    *   后端：NextJS API路由
    *   数据库：PostgreSQL
    *   ORM：Drizzle ORM (v0.43.1)
    *   AI集成：OpenAI SDK (v4)
    *   开发工具：TypeScript, ESLint
*   **开始使用：**
    1.  **前提：** Node.js 18+, PostgreSQL 数据库。
    2.  **安装：** 克隆仓库，`npm install` 安装依赖。
    3.  **环境配置：** 创建 `.env` 文件，配置 `DATABASE_URL` (PostgreSQL) 和 `NEXT_PUBLIC_APP_URL`。可选地，为护理助手集成功能配置连接外部MySQL数据库的环境变量。
    4.  **数据库迁移：**
        *   `npm run db:generate` (生成迁移文件)
        *   `npm run db:migrate` (应用迁移)
    5.  **启动开发服务器：** `npm run dev`，访问 `http://localhost:3000`。
*   **数据库管理命令：**
    *   生成迁移：`npm run db:generate`
    *   应用迁移：`npm run db:migrate`
    *   Drizzle Studio：`npm run db:studio`
*   **部署：**
    *   构建：`npm run build`
    *   启动：`npm run start`

## 第二部分：医疗职称备考智能助手需求规范文档

这部分详细描述了应用的核心功能、目标用户、用户痛点和技术选型。

*   **项目概述：**
    *   应用名称："医疗职称备考智能助手"
    *   目标：为医疗、护理、药技类专业人员提供 AI 驱动的个性化职称晋升备考方案。
    *   形式：Web H5，跨平台响应式设计。
*   **目标用户：**
    *   卫生专业技术人员，包括医疗类（医士/师、主治、副主任、主任医师）、护理类（护士/师、主管、副主任、主任护师）、药技类（药/技士/师、主管、副主任、主任药/技师）等各级别职称人员。
*   **用户痛点：**
    *   缺乏导师式引导的备考工具。
    *   需要定制化学习路径、任务拆解、进度跟踪、高质量内容及明确反馈。
*   **核心功能需求（摘要）：**
    1.  用户认证系统
    2.  首页功能
    3.  用户信息收集流程 (多阶段动态表单)
    4.  AI 驱动的个性化学习计划生成 (使用 `openai` SDK)
    5.  备考规划总览页面
    6.  学习内容页
    7.  用户中心
*   **技术规范 (与当前实现一致)：**
    *   **前端：** Next.js 15+ (App Router), React 19+, TypeScript, Tailwind CSS (v4), Shadcn UI, Lucide Icons, Zustand (v5), React Query (v5), SWR (v2), React Hook Form (v7), Zod (v3)。
    *   **后端：** Next.js API Routes.

详情请查阅项目根目录下的完整 `README.md`。 