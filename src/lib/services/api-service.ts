/**
 * @description API服务模块
 * @author 郝桃桃
 * @date 2024-05-24
 */

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

/**
 * @description 通用GET请求
 * @param url API路径
 * @returns Promise<ApiResponse<T>>
 */
export async function apiGet<T>(url: string): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || data.error || '请求失败');
    }
    
    return data;
  } catch (error) {
    console.error('API请求失败:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '请求失败'
    };
  }
}

/**
 * @description 通用POST请求
 * @param url API路径
 * @param body 请求体
 * @returns Promise<ApiResponse<T>>
 */
export async function apiPost<T>(url: string, body: any): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || data.error || '请求失败');
    }
    
    return data;
  } catch (error) {
    console.error('API请求失败:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '请求失败'
    };
  }
}

/**
 * @description 通用PUT请求
 * @param url API路径
 * @param body 请求体
 * @returns Promise<ApiResponse<T>>
 */
export async function apiPut<T>(url: string, body: any): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || data.error || '请求失败');
    }
    
    return data;
  } catch (error) {
    console.error('API请求失败:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '请求失败'
    };
  }
}

/**
 * @description 通用DELETE请求
 * @param url API路径
 * @returns Promise<ApiResponse<T>>
 */
export async function apiDelete<T>(url: string): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(url, {
      method: 'DELETE',
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || data.error || '请求失败');
    }
    
    return data;
  } catch (error) {
    console.error('API请求失败:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '请求失败'
    };
  }
} 