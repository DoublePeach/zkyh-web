# 医疗职称备考助手数据库改造设计

## 设计目标

设计一套能够支持动态管理备考知识内容(科目、章节、知识点)和章节测试的数据库结构，满足护理执业资格考试的需求（后续AI分析可能会根据数据库中的学习记录，生成学习计划）。新设计将使后台管理员能够清晰地管理这些数据，同时保留用户学习计划和进度跟踪功能。

## 数据库改造方案（只是建议，具体实现需要根据实际情况调整）

### 1. 保留的原有表结构
- `users` - 用户信息
- `user_progress` - 用户学习进度

### 2. 修改的表结构
- `study_plans` - 需要关联到新的知识体系结构
- `daily_tasks` - 需要调整关联关系
- `quizzes` - 需要与新的章节测试结构对接
- `questions` - 需要重新关联到知识点

### 3. 新增的表结构
- `exam_subjects` - 考试科目
- `nursing_disciplines` - 护理学科
- `chapters` - 章节
- `knowledge_points` - 知识点
- `test_banks` - 题库管理
- `admin_users` - 后台管理员账户

## 详细表结构设计

### 1. 考试科目表 (`exam_subjects`)
```sql
CREATE TABLE "public"."exam_subjects" (
  "id" SERIAL PRIMARY KEY,
  "code" VARCHAR(50) NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "order" INT NOT NULL, 
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT now()
);
```
- 存储四个考试科目：基础知识、相关专业知识、专业知识、专业实践能力
- `code`是科目编码，方便程序引用
- `order`控制科目显示顺序

### 2. 护理学科表 (`nursing_disciplines`)
```sql
CREATE TABLE "public"."nursing_disciplines" (
  "id" SERIAL PRIMARY KEY,
  "code" VARCHAR(50) NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "order" INT NOT NULL,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "icon_url" TEXT,
  "created_at" TIMESTAMP NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT now()
);
```
- 存储六个护理学科：外科护理学、内科护理学等
- `icon_url`用于前端显示学科图标
- `order`控制学科显示顺序

### 3. 章节表 (`chapters`)
```sql
CREATE TABLE "public"."chapters" (
  "id" SERIAL PRIMARY KEY,
  "subject_id" INT NOT NULL REFERENCES exam_subjects(id),
  "discipline_id" INT NOT NULL REFERENCES nursing_disciplines(id),
  "code" VARCHAR(50) NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "order" INT NOT NULL,
  "estimated_hours" DECIMAL(5,2) NOT NULL DEFAULT 2,
  "importance_level" INT NOT NULL DEFAULT 3,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT now()
);
```
- 一个章节同时关联到考试科目和护理学科
- `estimated_hours`帮助生成学习计划时分配时间
- `importance_level`标记重要性(1-5)，辅助生成备考策略

### 4. 知识点表 (`knowledge_points`)
```sql
CREATE TABLE "public"."knowledge_points" (
  "id" SERIAL PRIMARY KEY,
  "chapter_id" INT NOT NULL REFERENCES chapters(id),
  "code" VARCHAR(50) NOT NULL,
  "title" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "summary" TEXT,
  "key_concepts" JSONB,
  "difficulty_level" INT NOT NULL DEFAULT 3,
  "importance_level" INT NOT NULL DEFAULT 3,
  "estimated_minutes" INT NOT NULL DEFAULT 30,
  "order" INT NOT NULL,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "tags" TEXT[],
  "created_at" TIMESTAMP NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT now()
);
```
- 每个知识点归属于一个章节
- `content`存储详细的知识点内容
- `key_concepts`以JSON格式存储关键概念
- `tags`便于知识点的分类和搜索
- 增加难度和重要性评级

### 5. 测试题库表 (`test_banks`)
```sql
CREATE TABLE "public"."test_banks" (
  "id" SERIAL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "subject_id" INT REFERENCES exam_subjects(id),
  "discipline_id" INT REFERENCES nursing_disciplines(id),
  "is_chapter_specific" BOOLEAN NOT NULL DEFAULT false,
  "chapter_id" INT REFERENCES chapters(id),
  "difficulty_level" INT NOT NULL DEFAULT 3,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_by" INT NOT NULL, 
  "created_at" TIMESTAMP NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT now()
);
```
- 可以创建针对科目、学科或特定章节的题库
- `is_chapter_specific`标识是否为章节专用题库
- `created_by`记录创建管理员ID

### 6. 改造后的问题表 (`questions`)
```sql
CREATE TABLE "public"."questions" (
  "id" SERIAL PRIMARY KEY,
  "test_bank_id" INT NOT NULL REFERENCES test_banks(id),
  "knowledge_point_id" INT NOT NULL REFERENCES knowledge_points(id),
  "question_type" VARCHAR(50) NOT NULL,
  "content" TEXT NOT NULL,
  "options" JSONB NOT NULL,
  "correct_answer" TEXT NOT NULL,
  "explanation" TEXT NOT NULL,
  "reference" TEXT,
  "difficulty_level" INT NOT NULL DEFAULT 3,
  "discrimination_index" DECIMAL(3,2),
  "tags" TEXT[],
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_by" INT NOT NULL,
  "created_at" TIMESTAMP NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT now()
);
```
- 每个题目关联到题库和知识点
- 增加难度级别和区分度指数
- `discrimination_index`用于评估题目质量
- `reference`添加参考资料来源

### 7. 重构学习计划表 (`study_plans`)
```sql
CREATE TABLE "public"."study_plans" (
  "id" SERIAL PRIMARY KEY,
  "user_id" INT NOT NULL REFERENCES users(id),
  "title" TEXT NOT NULL,
  "overview" TEXT NOT NULL,
  "target_exam_date" DATE NOT NULL,
  "start_date" DATE NOT NULL,
  "end_date" DATE NOT NULL,
  "subjects" INT[] NOT NULL, -- 关联exam_subjects的id数组
  "disciplines" INT[] NOT NULL, -- 关联nursing_disciplines的id数组
  "study_intensity" VARCHAR(20) NOT NULL DEFAULT 'medium',
  "daily_hours" DECIMAL(4,2) NOT NULL DEFAULT 2,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT now()
);
```
- 计划关联到多个科目和学科
- 使用数组类型存储多个关联ID
- 增加学习强度设置

### 8. 学习任务表 (`study_tasks`)
```sql
CREATE TABLE "public"."study_tasks" (
  "id" SERIAL PRIMARY KEY,
  "plan_id" INT NOT NULL REFERENCES study_plans(id),
  "knowledge_point_id" INT NOT NULL REFERENCES knowledge_points(id),
  "scheduled_date" DATE NOT NULL,
  "estimated_minutes" INT NOT NULL,
  "is_completed" BOOLEAN NOT NULL DEFAULT false,
  "completion_date" TIMESTAMP,
  "mastery_level" INT,
  "notes" TEXT,
  "created_at" TIMESTAMP NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT now()
);
```
- 替代原来的daily_tasks表
- 直接关联到知识点
- 增加掌握程度评估

### 9. 作业测验表 (`study_quizzes`)
```sql
CREATE TABLE "public"."study_quizzes" (
  "id" SERIAL PRIMARY KEY,
  "plan_id" INT NOT NULL REFERENCES study_plans(id),
  "test_bank_id" INT NOT NULL REFERENCES test_banks(id),
  "chapter_id" INT REFERENCES chapters(id),
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "scheduled_date" DATE NOT NULL,
  "is_completed" BOOLEAN NOT NULL DEFAULT false,
  "completion_date" TIMESTAMP,
  "score" DECIMAL(5,2),
  "time_spent_minutes" INT,
  "created_at" TIMESTAMP NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT now()
);
```
- 用户的测验记录
- 关联到题库和可选的章节

### 10. 答题记录表 (`quiz_answers`)
```sql
CREATE TABLE "public"."quiz_answers" (
  "id" SERIAL PRIMARY KEY,
  "quiz_id" INT NOT NULL REFERENCES study_quizzes(id),
  "question_id" INT NOT NULL REFERENCES questions(id),
  "user_answer" TEXT NOT NULL,
  "is_correct" BOOLEAN NOT NULL,
  "time_spent_seconds" INT,
  "created_at" TIMESTAMP NOT NULL DEFAULT now()
);
```
- 记录用户的每道题目作答
- 便于生成错题集和学习分析

### 11. 管理员用户表 (`admin_users`)
```sql
CREATE TABLE "public"."admin_users" (
  "id" SERIAL PRIMARY KEY,
  "username" VARCHAR(50) NOT NULL UNIQUE,
  "password_hash" TEXT NOT NULL,
  "full_name" TEXT NOT NULL,
  "email" TEXT NOT NULL UNIQUE,
  "role" VARCHAR(20) NOT NULL DEFAULT 'editor',
  "permissions" JSONB NOT NULL DEFAULT '{"content":true,"users":false,"system":false}'::jsonb,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "last_login_at" TIMESTAMP,
  "created_at" TIMESTAMP NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT now()
);
```
- 后台管理员账户
- 支持角色和权限控制


## 管理系统功能模块建议

基于改造后的数据库结构，管理系统应包含以下功能模块：

1. **内容管理**
   - 科目管理：添加/编辑/停用考试科目
   - 学科管理：添加/编辑/停用护理学科
   - 章节管理：按科目和学科组织章节
   - 知识点管理：编辑知识点内容和属性

2. **题库管理**
   - 题库创建：创建和管理不同类型题库
   - 试题管理：添加/编辑/删除试题
   - 试题导入：批量导入试题
   - 试题审核：质量控制和审核

3. **学习计划管理**
   - 计划模板：创建学习计划模板
   - 学习路径：设计推荐学习路径
   - 任务规则：配置自动生成任务规则

4. **数据分析**
   - 题目分析：试题难度和区分度分析
   - 用户学习：学习行为和效果分析
   - 错题统计：错题分布和分析

5. **系统管理**
   - 管理员账户：管理员账户和权限管理
   - 系统配置：基础参数配置
   - 操作日志：系统操作记录
