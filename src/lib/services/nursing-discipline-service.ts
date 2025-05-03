/**
 * @description 护理学科服务模块
 * @author 郝桃桃
 * @date 2024-05-24
 */
import { apiGet, apiPost, apiPut, apiDelete } from './api-service';

// 护理学科类型
export interface NursingDiscipline {
  id: number;
  name: string;
  description: string;
  imageUrl?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// 创建或更新护理学科的请求类型
export interface NursingDisciplineRequest {
  name: string;
  description: string;
  imageUrl?: string;
}

const API_BASE_URL = '/api/admin/nursing-disciplines';

/**
 * @description 获取所有护理学科
 */
export async function getAllNursingDisciplines() {
  return await apiGet<NursingDiscipline[]>(API_BASE_URL);
}

/**
 * @description 获取单个护理学科
 * @param id 护理学科ID
 */
export async function getNursingDiscipline(id: number) {
  return await apiGet<NursingDiscipline>(`${API_BASE_URL}/${id}`);
}

/**
 * @description 创建护理学科
 * @param discipline 护理学科数据
 */
export async function createNursingDiscipline(discipline: NursingDisciplineRequest) {
  return await apiPost<NursingDiscipline>(API_BASE_URL, discipline);
}

/**
 * @description 更新护理学科
 * @param id 护理学科ID
 * @param discipline 护理学科数据
 */
export async function updateNursingDiscipline(id: number, discipline: NursingDisciplineRequest) {
  return await apiPut<NursingDiscipline>(`${API_BASE_URL}/${id}`, discipline);
}

/**
 * @description 删除护理学科
 * @param id 护理学科ID
 */
export async function deleteNursingDiscipline(id: number) {
  return await apiDelete<{ success: boolean }>(`${API_BASE_URL}/${id}`);
} 