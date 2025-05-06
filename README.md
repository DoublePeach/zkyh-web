# NextJS全栈Web应用

这是一个使用NextJS、Drizzle ORM和PostgreSQL构建的全栈Web应用-智考引航

## 技术栈

- **前端**：NextJS, React, TailwindCSS
- **后端**：NextJS API路由
- **数据库**：PostgreSQL
- **ORM**：Drizzle ORM
- **开发工具**：TypeScript, ESLint



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





## 部署

应用可以部署到支持NextJS的平台，如Vercel或自托管的服务器。

```bash
npm run build
npm run start
```




医疗职称备考智能助手需求规范文档
项目概述
"医疗职称备考智能助手"是一款面向医疗、护理和药技类专业人员的职称晋升备考应用。该应用通过 AI 驱动的个性化学习方案，帮助用户高效备考并提高考试通过率。本项目采用 Web H5 形式实现，支持跨平台响应式设计。
目标用户
卫生专业技术人员，具体包括以下职称级别人员：
1. 医疗类:
  ○ 初级职称：医士(师)
  ○ 中级职称：主治医师/主管医师
  ○ 副高级：副主任医师
  ○ 正高级：主任医师
2. 护理类:
  ○ 初级职称：护士(师)
  ○ 中级职称：主管护师
  ○ 副高级：副主任护师
  ○ 正高级：主任护师
3. 药技类:
  ○ 初级职称：药(技)士-药(技)师
  ○ 中级职称：主管药(技)师
  ○ 副高级：副主任药师/副主任技师
  ○ 正高级：主任药师/主任技师
用户痛点
目标用户缺乏一种能像导师一样引导他们备考的工具。他们需要：
● 基于个人情况的定制化学习路径
● 由浅入深的备考任务拆解
● 系统性的学习进度跟踪
● 高质量的考试内容和测验
● 明确的学习目标和反馈
核心功能需求
1. 用户认证系统
● 注册功能：
  ○ 用户名/密码注册
  ○ 邮箱验证
  ○ 用户协议同意选项
● 登录功能：
  ○ 用户名/密码登录
  ○ 登录状态保持
  ○ 密码重置功能
2. 首页功能
● 核心功能区：
  ○ 显眼的"开始备考规划"按钮
  ○ 用户当前学习进度概览（如已有计划）
  ○ 今日学习任务提醒
● 内容展示区：
  ○ 热门备考资源推荐
  ○ 职称考试资讯更新
  ○ 用户成功案例展示
3. 用户信息收集流程
●  多阶段表单收集： ○ (上方显示回答进度条)
考试基本信息
Q1: 您准备报考的护理职称等级是？
● 初级护师
● 主管护师
● 其他（请填写）
Q2: 您是首次参加此级别考试，还是已通过部分科目？
● 首次参加考试
● 已通过部分科目（2年内有效）
考试科目选择（若Q2选"已通过部分科目"才显示）
Q3: 请选择您本次需要考试的科目：
● 基础知识
● 相关专业知识
● 专业知识
● 实践能力
学习基础评估
Q4-A: 若为首次参加（Q2选首次）：您如何评价自己的总体学习基础？
● ★ 基础薄弱，需要从头开始
● ★★ 有一定基础，部分内容需要加强
● ★★★ 基础扎实，需要系统复习
Q4-B: 若已通过部分科目：请为您本次需要考试的各科目评估基础水平：
基础知识（若选择）：
● ★ 了解较少
● ★★ 一般了解
● ★★★ 熟悉掌握
相关专业知识（若选择）：
● ★ 了解较少
● ★★ 一般了解
● ★★★ 熟悉掌握
专业知识（若选择）：
● ★ 了解较少
● ★★ 一般了解
● ★★★ 熟悉掌握
实践能力（若选择）：
● ★ 了解较少
● ★★ 一般了解
● ★★★ 熟悉掌握
学习时间安排
Q5: 您平均每周能安排几天进行工作日学习？
● 1-2天
● 3-4天
● 5天（每个工作日）
Q6: 工作日平均每天能投入多少小时学习？
● 不到1小时
● 1-2小时
● 2-3小时
● 3小时以上
Q7: 周末平均每天能投入多少小时学习？
● 不到2小时
● 2-4小时
● 4-6小时
● 6小时以上
Q8: 您是否需要设置固定休息日？
● 是，每周需要完全休息的1天
● 是，每周需要完全休息的2天
● 否，可以根据进度灵活调整
● 动态表单路径： ○ 根据前一问题的回答动态调整后续问题（如科目选择、学习基础评估） ○ 医疗、护理、药技类别将展示不同的问题路径 ○ 针对不同职称级别提供定向问题
4. AI 驱动的个性化学习计划生成
● 学习计划生成：
  ○ 接入 OpenAI API 进行计划生成
  ○ 使用策略模式设计算法，便于未来替换不同策略
  ○ 基于用户信息、考试大纲、难度系数等生成计划
● 计划结构化输出：
  ○ 学习计划总体描述
  ○ 分阶段学习目标
  ○ 每日具体学习任务
  ○ 重点难点标注
  ○ 预期学习成果
5. 备考规划总览页面
● 计划概述展示：
  ○ 学习时间线
  ○ 整体学习周期
  ○ 阶段性目标
● 计划详情：
  ○ 各章节占比分析
  ○ 重点知识模块标识
  ○ 计划适应性说明
● 操作按钮：
  ○ "开始学习之旅"按钮（跳转至学习页）
  ○ 计划调整选项
  ○ 计划分享功能
6. 学习内容页
● 每日学习任务清单：
  ○ 今日待学习内容列表
  ○ 完成状态标识
  ○ 学习时间估计
● 学习内容模块：
  ○ MVP版本暂时从数据库中查到文本数据展示即可，无需其他额外功能
● 测验模块：
  ○ MVP版本暂时从数据库中查到文本数据展示即可，无需其他额外功能
7. 用户中心
● 个人信息管理：
  ○ 基础信息查看及修改
  ○ 学习目标设置
● 学习统计：
  ○ 学习时长统计
  ○ 完成进度百分比
  ○ 测验正确率分析
  ○ 薄弱环节识别
● 设置选项：
  ○ 通知提醒设置
  ○ 界面主题切换
  ○ 账号安全设置
技术规范
前端技术栈
1. 框架与核心技术：
  ○ Next.js 14+ (App Router)
  ○ React 18
  ○ TypeScript
2. UI 与样式：
  ○ Tailwind CSS 
  ○ Shadcn UI 组件库
  ○ Lucide Icons 图标库
  ○ 响应式设计（移动端优先）
3. 状态管理与数据获取：
  ○ Zustand 状态管理库
  ○ React Query 数据获取与缓存
  ○ SWR 实时数据更新
4. 表单处理：
  ○ React Hook Form
  ○ Zod 表单验证
后端技术栈
1. API 框架：
  ○ NestJS 框架
  ○ Swagger API 文档
2. 数据库技术：
  ○ PostgreSQL 数据库
  ○ Drizzle ORM
3. 认证与安全：
  ○ JWT 身份验证
  ○ Passport 策略集成
  ○ Cookies 管理
4. AI 集成：
  ○ OpenAI API 
  ○ LangChain.js 上下文处理
数据模型设计
用户模型 (Users)
{
  id: string;                  // 用户唯一标识
  username: string;            // 用户名
  passwordHash: string;        // 密码哈希
  profession: enum;            // 专业类别 (医疗/护理/药技)
  currentTitle: string;        // 当前职称
  targetTitle: string;         // 目标职称
  workYears: number;           // 工作年限
  studyTimePerDay: number;     // 每日学习时间(小时)
  examDate?: Date;             // 目标考试日期
  createdAt: Date;             // 创建时间
  updatedAt: Date;             // 更新时间
}
学习计划模型 (StudyPlans)
{
  id: string;                  // 计划唯一标识
  userId: string;              // 关联用户ID
  title: string;               // 计划标题
  overview: string;            // 计划概述
  profession: string;          // 专业类别
  targetTitle: string;         // 目标职称
  totalDays: number;           // 计划总天数
  startDate: Date;             // 计划开始日期
  endDate: Date;               // 计划结束日期
  isActive: boolean;           // 是否激活
  createdAt: Date;             // 创建时间
  updatedAt: Date;             // 更新时间
}
学习模块模型 (StudyModules)
{
  id: string;                  // 模块唯一标识
  planId: string;              // 关联计划ID
  title: string;               // 模块标题
  description: string;         // 模块描述
  order: number;               // 模块顺序
  durationDays: number;        // 持续天数
  importance: number;          // 重要性评分(1-10)
  difficulty: number;          // 难度评分(1-10)
}
每日任务模型 (DailyTasks)
{
  id: string;                  // 任务唯一标识
  moduleId: string;            // 关联模块ID
  day: number;                 // 计划第几天
  title: string;               // 任务标题
  description: string;         // 任务描述
  learningContent: string;     // 学习内容(富文本)
  estimatedMinutes: number;    // 预计完成时间(分钟)
  isCompleted: boolean;        // 是否已完成
  completedAt?: Date;          // 完成时间
}
测验模型 (Quizzes)
{
  id: string;                  // 测验唯一标识
  taskId: string;              // 关联任务ID
  title: string;               // 测验标题
  description: string;         // 测验描述
  questions: Question[];       // 问题集合
  passScore: number;           // 通过分数
  timeLimit?: number;          // 时间限制(分钟)
  attempts: number;            // 尝试次数
}
问题模型 (Questions)
{
  id: string;                  // 问题唯一标识
  quizId: string;              // 关联测验ID
  type: enum;                  // 问题类型(单选/多选/简答)
  content: string;             // 问题内容
  options?: Option[];          // 选项(选择题)
  answer: string;              // 答案
  explanation: string;         // 答案解析
  points: number;              // 分值
}
用户进度模型 (UserProgress)
{
  id: string;                  // 进度唯一标识
  userId: string;              // 关联用户ID
  taskId: string;              // 关联任务ID
  progress: number;            // 进度百分比(0-100)
  timeSpent: number;           // 花费时间(分钟)
  lastAccessedAt: Date;        // 最后访问时间
}

用户流程图
1. 用户注册/登录 → 首页
2. 首页 → 点击"开始备考规划" → 用户信息收集
3. 用户信息收集 → 生成个性化备考规划 → 备考规划总览
4. 备考规划总览 → 点击"开始学习之旅" → 学习页面
5. 学习页面 → 选择学习任务 → 学习内容/测验
6. 完成学习任务 → 更新进度 → 下一个学习任务
页面结构
底部导航栏
所有页面底部统一包含三个主要导航项:
● 首页: 返回应用首页
● 学习: 跳转至当前学习计划页
● 我的: 跳转至用户中心
学习页特殊状态
● 当用户没有活跃的备考规划时:
  ○ 显示空状态提示
  ○ 提供"前往制定备考规划"按钮
● 当用户有活跃的备考规划时:
  ○ 展示今日学习任务
  ○ 显示学习进度条
  ○ 提供快速访问必要的学习资源的入口
API 接口规范
用户认证相关
● POST /api/auth/register - 用户注册
● POST /api/auth/login - 用户登录
● POST /api/auth/logout - 用户登出
● GET /api/auth/me - 获取当前用户信息
学习计划相关
● POST /api/study-plans - 创建学习计划
● GET /api/study-plans - 获取用户所有学习计划
● GET /api/study-plans/:id - 获取特定计划详情
● GET /api/study-plans/:id/modules - 获取计划的所有学习模块
● GET /api/study-plans/:id/today - 获取今日学习任务
学习内容相关
● GET /api/modules/:id - 获取特定模块详情
● GET /api/tasks/:id - 获取特定任务详情
● GET /api/tasks/:id/content - 获取学习内容
● PATCH /api/tasks/:id/complete - 标记任务完成
测验相关
● GET /api/tasks/:id/quiz - 获取任务相关的测验
● POST /api/quizzes/:id/submit - 提交测验答案
● GET /api/quizzes/:id/result - 获取测验结果
AI 生成相关
● POST /api/ai/generate-plan - 生成学习计划
● POST /api/ai/analyze-progress - 分析学习进度并提供建议
策略模式实现规范
学习计划生成使用策略模式设计，便于替换不同的AI模型或生成算法。

