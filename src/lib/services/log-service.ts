/**
 * @description 用户操作日志服务 - 记录用户行为（客户端安全版本）
 * @author 郝桃桃
 * @date 2024-05-10
 */

export interface UserActionInput {
  userId: number;
  action: string;     // 用户行为
  page: string;       // 页面路径
  details?: object;   // 详细信息
}

/**
 * @description 记录用户操作 - 客户端版本
 * 此函数是安全的客户端版本，不会尝试直接访问数据库
 * @param action 用户操作信息
 * @returns 是否成功
 */
export async function logUserAction(action: UserActionInput): Promise<boolean> {
  try {
    // 在客户端通过API发送到服务器
    const response = await fetch('/api/logs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(action),
    });
    
    return response.ok;
  } catch (error) {
    console.error('记录用户操作失败:', error);
    // 即使记录失败也不阻止应用继续运行
    return false;
  }
} 