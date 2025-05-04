/**
 * @description API服务模块
 * @author 郝桃桃
 * @date 2024-05-24
 */

// Define and EXPORT a generic API response structure
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  details?: unknown; // Use unknown instead of any for details
}

/**
 * @description 通用GET请求
 * @param url API路径
 * @returns Promise<ApiResponse<T>>
 */
export async function apiGet<T>(url: string): Promise<ApiResponse<T>> {
  console.log(`[API] 发起GET请求: ${url}`);
  try {
    const response = await fetch(url, {
      credentials: 'include', // 确保发送cookie
    });
    if (!response.ok) {
        // Try to parse error response, default to status text
        let errorData: Partial<ApiResponse<never>> = { error: response.statusText };
        try {
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                errorData = await response.json();
                console.log("[API] GET错误详情:", errorData);
            }
        } catch (parseError) {
            console.error("[API] 解析GET错误响应失败:", parseError);
        }
        console.error(`[API] GET错误 (${response.status}): ${url}`, errorData);
        return { 
            success: false, 
            error: errorData.error || response.statusText, 
            message: errorData.message,
            details: errorData.details
        };
    }
    console.log(`[API] GET请求成功: ${url}`);
    return await response.json() as ApiResponse<T>; // Assume successful response matches structure
  } catch (error: unknown) {
    console.error(`[API] GET请求失败: ${url}`, error);
    const message = error instanceof Error ? error.message : "Network request failed";
    return { success: false, error: message };
  }
}

/**
 * @description 通用POST请求
 * @param url API路径
 * @param body 请求体
 * @returns Promise<ApiResponse<T>>
 */
export async function apiPost<T>(url: string, data: unknown): Promise<ApiResponse<T>> {
  console.log(`[API] 发起POST请求: ${url}`, data);
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      credentials: 'include', // 确保发送cookie
    });
     if (!response.ok) {
        let errorData: Partial<ApiResponse<never>> = { error: response.statusText };
        try {
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                errorData = await response.json();
                console.log("[API] POST错误详情:", errorData);
            }
        } catch (parseError) {
            console.error("[API] 解析POST错误响应失败:", parseError);
        }
        console.error(`[API] POST错误 (${response.status}): ${url}`, errorData);
        return { 
            success: false, 
            error: errorData.error || response.statusText, 
            message: errorData.message, 
            details: errorData.details 
        };
    }
    console.log(`[API] POST请求成功: ${url}`);
    return await response.json() as ApiResponse<T>;
  } catch (error: unknown) {
    console.error(`[API] POST请求失败: ${url}`, error);
    const message = error instanceof Error ? error.message : "Network request failed";
    return { success: false, error: message };
  }
}

/**
 * @description 通用PUT请求
 * @param url API路径
 * @param body 请求体
 * @returns Promise<ApiResponse<T>>
 */
export async function apiPut<T>(url: string, data: unknown): Promise<ApiResponse<T>> {
   console.log(`[API] 发起PUT请求: ${url}`, data);
   try {
    const response = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      credentials: 'include', // 确保发送cookie
    });
     if (!response.ok) {
        let errorData: Partial<ApiResponse<never>> = { error: response.statusText };
        try {
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                errorData = await response.json();
                console.log("[API] PUT错误详情:", errorData);
            }
        } catch (parseError) {
            console.error("[API] 解析PUT错误响应失败:", parseError);
        }
        console.error(`[API] PUT错误 (${response.status}): ${url}`, errorData);
        return { 
            success: false, 
            error: errorData.error || response.statusText, 
            message: errorData.message, 
            details: errorData.details 
        };
    }
    console.log(`[API] PUT请求成功: ${url}`);
    return await response.json() as ApiResponse<T>;
  } catch (error: unknown) {
    console.error(`[API] PUT请求失败: ${url}`, error);
    const message = error instanceof Error ? error.message : "Network request failed";
    return { success: false, error: message };
  }
}

/**
 * @description 通用DELETE请求
 * @param url API路径
 * @returns Promise<ApiResponse<T>>
 */
export async function apiDelete<T>(url: string): Promise<ApiResponse<T>> {
  console.log(`[API] 发起DELETE请求: ${url}`);
  try {
    const response = await fetch(url, {
      method: 'DELETE',
      credentials: 'include', // 确保发送cookie
    });
    // DELETE might return 204 No Content on success with empty body
    if (response.status === 204) {
      console.log(`[API] DELETE请求成功(204): ${url}`);
      return { success: true }; // Return success without data
    }
    if (!response.ok) {
      let errorData: Partial<ApiResponse<never>> = { error: response.statusText };
      
      try {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          errorData = await response.json();
          console.log("[API] DELETE错误详情:", errorData);
        } else {
          console.log("[API] DELETE响应不是JSON格式");
        }
      } catch (parseError) { 
        console.error("[API] 解析DELETE错误响应失败:", parseError);
      }
      
      console.error(`[API] DELETE错误 (${response.status}): ${url}`, errorData);
      return { 
        success: false, 
        error: errorData.error || response.statusText, 
        message: errorData.message,
        details: errorData.details
      };
    }
    // If response is OK but not 204, try to parse JSON
    console.log(`[API] DELETE请求成功: ${url}`);
    return await response.json() as ApiResponse<T>; 
  } catch (error: unknown) {
    console.error(`[API] DELETE请求失败: ${url}`, error);
    const message = error instanceof Error ? error.message : "Network request failed";
    return { success: false, error: message };
  }
} 