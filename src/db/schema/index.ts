/**
 * @description 主数据库 Schema 定义文件
 * @author 郝桃桃
 * @date 2024-05-20
 */
import { relations } from "drizzle-orm";
import { pgTable, serial, varchar, text, timestamp, integer, jsonb, boolean, pgEnum } from "drizzle-orm/pg-core";

// --- 用户表 (Users) ---
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  username: varchar('username', { length: 256 }).unique(),
  passwordHash: varchar('password_hash', { length: 256 }),
  profession: varchar('profession', { length: 256 }),
  currentTitle: varchar('current_title', { length: 256 }),
  targetTitle: varchar('target_title', { length: 256 }),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// --- 管理员用户表 (Admin Users) ---
export const adminUsers = pgTable('admin_users', {
  id: serial('id').primaryKey(),
  username: varchar('username', { length: 255 }).unique().notNull(),
  password: varchar('password', { length: 255 }).notNull(), // 实际项目应存储哈希值
  name: varchar('name', { length: 255 }),
  role: varchar('role', { length: 50 }).default('admin'), // e.g., admin, editor
  isActive: boolean('is_active').default(true),
  lastLogin: timestamp('last_login'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// --- 护理学学科表 (Nursing Disciplines) ---
export const nursingDisciplines = pgTable('nursing_disciplines', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  imageUrl: varchar('image_url', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// --- 章节表 (Chapters) ---
export const chapters = pgTable('chapters', {
  id: serial('id').primaryKey(),
  disciplineId: integer('discipline_id').references(() => nursingDisciplines.id).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  orderIndex: integer('order_index').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// --- 考试科目表 (Exam Subjects) ---
export const examSubjects = pgTable('exam_subjects', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  weight: varchar('weight', { length: 10 }), // 新增：考试权重，例如 "45%"
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// --- 知识点表 (Knowledge Points) ---
export const knowledgePoints = pgTable('knowledge_points', {
  id: serial('id').primaryKey(),
  chapterId: integer('chapter_id').references(() => chapters.id).notNull(),
  subjectId: integer('subject_id').references(() => examSubjects.id).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  content: text('content'),
  difficulty: integer('difficulty').default(3).notNull(), // 难度 (1-5)
  importance: integer('importance').default(3).notNull(), // 重要度 (1-5)
  keywords: text('keywords').array(),  // 关键词使用text数组类型
  tags: jsonb('tags').$type<Record<string, unknown>>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// --- 题库表 (Test Banks) ---
export const testBanks = pgTable('test_banks', {
  id: serial('id').primaryKey(),
  subjectId: integer('subject_id').references(() => examSubjects.id).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  type: varchar('type', { length: 50 }).notNull(), // 类型 (e.g., 模拟题, 历年真题, 练习题)
  year: integer('year'), // 年份 (for 历年真题)
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// --- 试题类型枚举 ---
export const questionTypeEnum = pgEnum('question_type', ['单选题', '多选题', '判断题', '简答题', '案例分析题']);

// --- 试题表 (Quiz Questions) ---
export const quizQuestions = pgTable('quiz_questions', {
  id: serial('id').primaryKey(),
  testBankId: integer('test_bank_id').references(() => testBanks.id).notNull(),
  knowledgePointId: integer('knowledge_point_id').references(() => knowledgePoints.id),
  questionType: questionTypeEnum('question_type').notNull(),
  content: text('content').notNull(),
  options: jsonb('options').$type<{key: string, value: string}[]>(), // 选项 (for 选择题/判断题)
  correctAnswer: text('correct_answer').notNull(),
  explanation: text('explanation'),
  difficulty: integer('difficulty').default(3).notNull(), // 难度 (1-5)
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// --- 试卷状态枚举 ---
export const examPaperStatusEnum = pgEnum('exam_paper_status', ['draft', 'published', 'archived']);

// --- 试卷表 (Exam Papers) ---
export const examPapers = pgTable('exam_papers', {
  id: serial('id').primaryKey(),                                     // 试卷唯一标识
  title: varchar('title', { length: 255 }).notNull(),                 // 试卷标题
  description: text('description'),                                    // 试卷描述
  subjectId: integer('subject_id').references(() => examSubjects.id), // 关联的考试科目ID
  duration: integer('duration'),                                       // 考试时长（分钟）
  totalScore: integer('total_score'),                                  // 总分
  passingScore: integer('passing_score'),                              // 及格分数
  questionIds: jsonb('question_ids').$type<number[]>(),                // 包含的试题ID列表 (存储ID数组)
  status: examPaperStatusEnum('status').default('draft'),               // 试卷状态 (draft, published, archived)
  createdAt: timestamp('created_at').defaultNow().notNull(),         // 创建时间
  updatedAt: timestamp('updated_at').defaultNow().notNull(),         // 更新时间
});

// --- 定义关系 ---

// 护理学科与章节的关系
export const nursingDisciplinesRelations = relations(nursingDisciplines, ({ many }) => ({
  chapters: many(chapters),
}));

// 章节与护理学科、知识点的关系
export const chaptersRelations = relations(chapters, ({ one, many }) => ({
  discipline: one(nursingDisciplines, {
    fields: [chapters.disciplineId],
    references: [nursingDisciplines.id],
  }),
  knowledgePoints: many(knowledgePoints),
}));

// 考试科目与知识点、题库、试卷的关系
export const examSubjectsRelations = relations(examSubjects, ({ many }) => ({
  knowledgePoints: many(knowledgePoints),
  testBanks: many(testBanks),
  examPapers: many(examPapers), // 与试卷的一对多关系
}));

// 知识点与章节、考试科目、试题的关系
export const knowledgePointsRelations = relations(knowledgePoints, ({ one, many }) => ({
  chapter: one(chapters, {
    fields: [knowledgePoints.chapterId],
    references: [chapters.id],
  }),
  subject: one(examSubjects, {
    fields: [knowledgePoints.subjectId],
    references: [examSubjects.id],
  }),
  quizQuestions: many(quizQuestions),
}));

// 题库与考试科目、试题的关系
export const testBanksRelations = relations(testBanks, ({ one, many }) => ({
  subject: one(examSubjects, {
    fields: [testBanks.subjectId],
    references: [examSubjects.id],
  }),
  quizQuestions: many(quizQuestions),
}));

// 试题与题库、知识点的关系
export const quizQuestionsRelations = relations(quizQuestions, ({ one }) => ({
  testBank: one(testBanks, {
    fields: [quizQuestions.testBankId],
    references: [testBanks.id],
  }),
  knowledgePoint: one(knowledgePoints, {
    fields: [quizQuestions.knowledgePointId],
    references: [knowledgePoints.id],
  }),
}));

// 试卷与考试科目的关系
export const examPapersRelations = relations(examPapers, ({ one }) => ({
	examSubject: one(examSubjects, {
		fields: [examPapers.subjectId],
		references: [examSubjects.id],
	}),
})); 