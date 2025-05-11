/**
 * @description 管理员用户操作日志服务 - 获取用户操作日志
 * @author 郝桃桃
 * @date 2024-05-10
 */

/**
 * @description 获取用户操作日志（用于管理员）
 * @param userId 用户ID（可选）
 * @param page 页码
 * @param pageSize 每页条数
 * @returns 操作日志列表及总数
 */
export async function getUserActionLogs(userId?: number, page = 1, pageSize = 20) {
  try {
    // 构建查询参数
    const params = new URLSearchParams();
    params.set('page', page.toString());
    params.set('pageSize', pageSize.toString());
    
    if (userId) {
      params.set('userId', userId.toString());
    }
    
    // 通过API获取日志
    const response = await fetch(`/api/admin/logs?${params.toString()}`);
    
    if (!response.ok) {
      throw new Error('获取操作日志失败');
    }
    
    return await response.json();
  } catch (error) {
    console.error('获取用户操作日志失败:', error);
    throw error;
  }
} 