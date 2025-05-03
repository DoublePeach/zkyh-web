/**
 * @description 考试科目服务模块
 * @author 郝桃桃
 * @date 2024-05-25
 */
import { apiGet, apiPost, apiPut, apiDelete } from './api-service';

// 考试科目类型
export interface ExamSubject {
  id: number;
  name: string;
  description: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// 创建或更新考试科目的请求类型
export interface ExamSubjectRequest {
  name: string;
  description: string;
}

const API_BASE_URL = '/api/admin/exam-subjects';

/**
 * @description 获取所有考试科目
 */
export async function getAllExamSubjects() {
  return await apiGet<ExamSubject[]>(API_BASE_URL);
}

/**
 * @description 获取单个考试科目
 * @param id 考试科目ID
 */
export async function getExamSubject(id: number) {
  return await apiGet<ExamSubject>(`${API_BASE_URL}/${id}`);
}

/**
 * @description 创建考试科目
 * @param examSubject 考试科目数据
 */
export async function createExamSubject(examSubject: ExamSubjectRequest) {
  return await apiPost<ExamSubject>(API_BASE_URL, examSubject);
}

/**
 * @description 更新考试科目
 * @param id 考试科目ID
 * @param examSubject 考试科目数据
 */
export async function updateExamSubject(id: number, examSubject: ExamSubjectRequest) {
  return await apiPut<ExamSubject>(`${API_BASE_URL}/${id}`, examSubject);
}

/**
 * @description 删除考试科目
 * @param id 考试科目ID
 */
export async function deleteExamSubject(id: number) {
  return await apiDelete<{ success: boolean }>(`${API_BASE_URL}/${id}`);
} 