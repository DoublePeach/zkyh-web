import { StudyMode } from '@/db/schema/users';

/**
 * @description 获取用户学习模式
 * @param userId 用户ID
 * @returns 学习模式
 */
export async function getUserStudyMode(userId: number | string): Promise<StudyMode> {
  try {
    const response = await fetch(`/api/users/${userId}/study-mode`);
    
    if (!response.ok) {
      throw new Error(`获取用户学习模式失败: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.data.studyMode;
  } catch (error) {
    console.error('获取用户学习模式失败:', error);
    // 默认返回正常模式
    return 'normal';
  }
}

/**
 * @description 更新用户学习模式
 * @param userId 用户ID
 * @param studyMode 学习模式
 * @returns 是否更新成功
 */
export async function updateUserStudyMode(userId: number | string, studyMode: StudyMode): Promise<boolean> {
  try {
    const response = await fetch(`/api/users/${userId}/study-mode`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ studyMode }),
    });
    
    if (!response.ok) {
      throw new Error(`更新用户学习模式失败: ${response.statusText}`);
    }
    
    return true;
  } catch (error) {
    console.error('更新用户学习模式失败:', error);
    return false;
  }
} 