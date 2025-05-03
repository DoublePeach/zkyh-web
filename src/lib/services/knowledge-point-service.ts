/**
 * @description 知识点服务模块
 * @author 郝桃桃
 * @date 2024-05-25
 */
import { apiGet, apiPost, apiPut, apiDelete } from './api-service';

// 知识点类型
export interface KnowledgePoint {
  id: number;
  chapterId: number;
  chapterName?: string;
  disciplineId?: number;
  disciplineName?: string;
  subjectId: number;
  subjectName?: string;
  title: string;
  content: string;
  difficulty: number;
  importance: number;
  keywords?: string[];
  tags?: Record<string, any>;
  createdAt?: Date;
  updatedAt?: Date;
}

// 创建或更新知识点的请求类型
export interface KnowledgePointRequest {
  chapterId: number;
  subjectId: number;
  title: string;
  content: string;
  difficulty: number;
  importance: number;
  keywords?: string[];
  tags?: Record<string, any>;
}

const API_BASE_URL = '/api/admin/knowledge-points';

/**
 * @description 获取所有知识点
 * @param disciplineId 可选的护理学科ID筛选
 * @param chapterId 可选的章节ID筛选
 * @param subjectId 可选的考试科目ID筛选
 * @param search 可选的搜索关键词
 */
export async function getAllKnowledgePoints(options?: {
  disciplineId?: number;
  chapterId?: number;
  subjectId?: number;
  search?: string;
}) {
  let url = API_BASE_URL;
  const params = new URLSearchParams();
  
  if (options) {
    if (options.disciplineId) params.append('disciplineId', options.disciplineId.toString());
    if (options.chapterId) params.append('chapterId', options.chapterId.toString());
    if (options.subjectId) params.append('subjectId', options.subjectId.toString());
    if (options.search) params.append('search', options.search);
  }
  
  if (params.toString()) {
    url += `?${params.toString()}`;
  }
    
  return await apiGet<KnowledgePoint[]>(url);
}

/**
 * @description 获取单个知识点
 * @param id 知识点ID
 */
export async function getKnowledgePoint(id: number) {
  return await apiGet<KnowledgePoint>(`${API_BASE_URL}/${id}`);
}

/**
 * @description 创建知识点
 * @param knowledgePoint 知识点数据
 */
export async function createKnowledgePoint(knowledgePoint: KnowledgePointRequest) {
  return await apiPost<KnowledgePoint>(API_BASE_URL, knowledgePoint);
}

/**
 * @description 更新知识点
 * @param id 知识点ID
 * @param knowledgePoint 知识点数据
 */
export async function updateKnowledgePoint(id: number, knowledgePoint: KnowledgePointRequest) {
  return await apiPut<KnowledgePoint>(`${API_BASE_URL}/${id}`, knowledgePoint);
}

/**
 * @description 删除知识点
 * @param id 知识点ID
 */
export async function deleteKnowledgePoint(id: number) {
  return await apiDelete<{ success: boolean }>(`${API_BASE_URL}/${id}`);
} 