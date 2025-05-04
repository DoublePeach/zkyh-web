/**
 * @description 题库服务模块
 * @author 郝桃桃
 * @date 2024-05-25
 */
import { apiGet, apiPost, apiPut, apiDelete } from './api-service';

// 题库类型
export interface TestBank {
  id: number;
  name: string;
  description: string;
  type: string;
  year: number | null;
  subjectId: number;
  subjectName?: string; // 考试科目名称
  totalQuestions: number;
  createdAt?: Date;
  updatedAt?: Date;
}

// 创建或更新题库的请求类型
export interface TestBankRequest {
  name: string;
  description: string;
  type: string;
  year?: number | null;
  subjectId: number;
}

const API_BASE_URL = '/api/admin/test-banks';

/**
 * @description 获取所有题库
 * @param subjectId 可选的考试科目ID筛选
 * @param type 可选的题库类型筛选
 */
export async function getAllTestBanks(options?: {
  subjectId?: number;
  type?: string;
}) {
  let url = API_BASE_URL;
  const params = new URLSearchParams();
  
  if (options) {
    if (options.subjectId) params.append('subjectId', options.subjectId.toString());
    if (options.type) params.append('type', options.type);
  }
  
  if (params.toString()) {
    url += `?${params.toString()}`;
  }
    
  return await apiGet<TestBank[]>(url);
}

/**
 * @description 获取单个题库
 * @param id 题库ID
 */
export async function getTestBank(id: number) {
  return await apiGet<TestBank>(`${API_BASE_URL}/${id}`);
}

/**
 * @description 创建题库
 * @param testBank 题库数据
 */
export async function createTestBank(testBank: TestBankRequest) {
  return await apiPost<TestBank>(API_BASE_URL, testBank);
}

/**
 * @description 更新题库
 * @param id 题库ID
 * @param testBank 题库数据
 */
export async function updateTestBank(id: number, testBank: TestBankRequest) {
  return await apiPut<TestBank>(`${API_BASE_URL}/${id}`, testBank);
}

/**
 * @description 删除题库
 * @param id 题库ID
 */
export async function deleteTestBank(id: number) {
  return await apiDelete<{ success: boolean }>(`${API_BASE_URL}/${id}`);
} 