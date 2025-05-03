/**
 * @description 章节服务模块
 * @author 郝桃桃
 * @date 2024-05-24
 */
import { apiGet, apiPost, apiPut, apiDelete } from './api-service';

// 章节类型
export interface Chapter {
  id: number;
  disciplineId: number;
  disciplineName?: string;
  name: string;
  description: string;
  orderIndex: number;
  createdAt?: Date;
  updatedAt?: Date;
  knowledgePointCount?: number;
}

// 创建或更新章节的请求类型
export interface ChapterRequest {
  disciplineId: number;
  name: string;
  description: string;
  orderIndex: number;
}

const API_BASE_URL = '/api/admin/chapters';

/**
 * @description 获取所有章节
 * @param disciplineId 可选的护理学科ID筛选
 */
export async function getAllChapters(disciplineId?: number) {
  const url = disciplineId 
    ? `${API_BASE_URL}?disciplineId=${disciplineId}` 
    : API_BASE_URL;
    
  return await apiGet<Chapter[]>(url);
}

/**
 * @description 获取单个章节
 * @param id 章节ID
 */
export async function getChapter(id: number) {
  return await apiGet<Chapter>(`${API_BASE_URL}/${id}`);
}

/**
 * @description 创建章节
 * @param chapter 章节数据
 */
export async function createChapter(chapter: ChapterRequest) {
  return await apiPost<Chapter>(API_BASE_URL, chapter);
}

/**
 * @description 更新章节
 * @param id 章节ID
 * @param chapter 章节数据
 */
export async function updateChapter(id: number, chapter: ChapterRequest) {
  return await apiPut<Chapter>(`${API_BASE_URL}/${id}`, chapter);
}

/**
 * @description 删除章节
 * @param id 章节ID
 */
export async function deleteChapter(id: number) {
  return await apiDelete<{ success: boolean }>(`${API_BASE_URL}/${id}`);
} 