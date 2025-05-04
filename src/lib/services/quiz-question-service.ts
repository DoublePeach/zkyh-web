/**
 * @description 试题服务模块
 * @author 郝桃桃
 * @date 2024-05-26
 */
import { apiGet, apiPost, apiPut, apiDelete } from './api-service';
// import { ApiResponse } from './api-service'; // Unused

// Define the structure for question options
export type QuestionOption = { key: string; value: string };

// 试题类型
export interface QuizQuestion {
  id: number;
  testBankId: number;
  knowledgePointId?: number | null;
  knowledgePointTitle?: string;
  questionType: string;
  content: string;
  options: QuestionOption[] | null;
  correctAnswer: string;
  explanation: string;
  difficulty: number;
  createdAt?: Date;
  updatedAt?: Date;
}

// 创建或更新试题的请求类型
export interface QuizQuestionRequest {
  testBankId: number;
  knowledgePointId?: number | null;
  questionType: string;
  content: string;
  options: QuestionOption[] | null;
  correctAnswer: string;
  explanation: string;
  difficulty: number;
}

const API_BASE_URL = '/api/admin/quiz-questions';

/**
 * @description 获取题库下的所有试题
 * @param testBankId 题库ID
 */
export async function getQuizQuestionsByTestBank(testBankId: number) {
  return await apiGet<QuizQuestion[]>(`${API_BASE_URL}?testBankId=${testBankId}`);
}

/**
 * @description 获取单个试题
 * @param id 试题ID
 */
export async function getQuizQuestion(id: number) {
  return await apiGet<QuizQuestion>(`${API_BASE_URL}/${id}`);
}

/**
 * @description 创建试题
 * @param question 试题数据
 */
export async function createQuizQuestion(question: QuizQuestionRequest) {
  return await apiPost<QuizQuestion>(API_BASE_URL, question);
}

/**
 * @description 更新试题
 * @param id 试题ID
 * @param question 试题数据
 */
export async function updateQuizQuestion(id: number, question: QuizQuestionRequest) {
  return await apiPut<QuizQuestion>(`${API_BASE_URL}/${id}`, question);
}

/**
 * @description 删除试题
 * @param id 试题ID
 */
export async function deleteQuizQuestion(id: number) {
  return await apiDelete<{ success: boolean }>(`${API_BASE_URL}/${id}`);
}

/**
 * @description 批量创建试题
 * @param questions 试题数据数组
 */
export async function bulkCreateQuizQuestions(questions: QuizQuestionRequest[]) {
  return await apiPost<{ success: boolean; count: number }>(`${API_BASE_URL}/bulk`, { questions });
} 