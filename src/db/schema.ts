/**
 * @description 数据库表结构导出整合
 * @author 郝桃桃
 * @date 2024-05-23
 */
import { InferModel } from 'drizzle-orm';

// 导入schema
export * from './schema/users';
export * from './schema/studyPlans';
export * from './schema/studyModules';
export * from './schema/dailyTasks';
export * from './schema/quizzes';
export * from './schema/questions';
export * from './schema/userProgress';
export * from './schema/examSubjects';
export * from './schema/nursingDisciplines';
export * from './schema/chapters';
export * from './schema/knowledgePoints';
export * from './schema/testBanks';
export * from './schema/quizQuestions';
export * from './schema/adminUsers';
export * from './schema/knowledgeTasks';

// 导入各个表
import { examSubjects } from './schema/examSubjects';
import { nursingDisciplines } from './schema/nursingDisciplines';
import { chapters } from './schema/chapters';
import { knowledgePoints } from './schema/knowledgePoints';
import { testBanks } from './schema/testBanks';
import { quizQuestions } from './schema/quizQuestions';
import { adminUsers } from './schema/adminUsers';
import { knowledgeTasks } from './schema/knowledgeTasks';
import { users } from './schema/users';
import { studyPlans } from './schema/studyPlans';
import { studyModules } from './schema/studyModules';
import { dailyTasks } from './schema/dailyTasks';
import { quizzes } from './schema/quizzes';
import { questions } from './schema/questions';
import { userProgress } from './schema/userProgress';

// 导出类型
export type ExamSubject = InferModel<typeof examSubjects>;
export type NursingDiscipline = InferModel<typeof nursingDisciplines>;
export type Chapter = InferModel<typeof chapters>;
export type KnowledgePoint = InferModel<typeof knowledgePoints>;
export type TestBank = InferModel<typeof testBanks>;
export type QuizQuestion = InferModel<typeof quizQuestions>;
export type AdminUser = InferModel<typeof adminUsers>;
export type KnowledgeTask = InferModel<typeof knowledgeTasks>;
export type User = InferModel<typeof users>;
export type StudyPlan = InferModel<typeof studyPlans>;
export type StudyModule = InferModel<typeof studyModules>;
export type DailyTask = InferModel<typeof dailyTasks>;
export type Quiz = InferModel<typeof quizzes>;
export type Question = InferModel<typeof questions>;
export type UserProgress = InferModel<typeof userProgress>;

// 准备查询对象
export const schema = {
  examSubjects,
  nursingDisciplines,
  chapters,
  knowledgePoints,
  testBanks,
  quizQuestions,
  adminUsers,
  knowledgeTasks,
  users,
  studyPlans,
  studyModules,
  dailyTasks,
  quizzes,
  questions,
  userProgress
}; 