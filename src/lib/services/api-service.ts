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
  try {
    const response = await fetch(url);
    if (!response.ok) {
        // Try to parse error response, default to status text
        let errorData: Partial<ApiResponse<never>> = { error: response.statusText };
        try {
            errorData = await response.json();
        } catch { /* Ignore parsing error */ }
      console.error(`API GET Error (${response.status}): ${url}`, errorData);
      return { success: false, error: errorData.error || response.statusText, message: errorData.message };
    }
    return await response.json() as ApiResponse<T>; // Assume successful response matches structure
  } catch (error: unknown) {
    console.error(`API GET Fetch Error: ${url}`, error);
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
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
     if (!response.ok) {
        let errorData: Partial<ApiResponse<never>> = { error: response.statusText };
        try {
            errorData = await response.json();
        } catch { /* Ignore parsing error */ }
        console.error(`API POST Error (${response.status}): ${url}`, errorData);
        return { success: false, error: errorData.error || response.statusText, message: errorData.message, details: errorData.details };
    }
    return await response.json() as ApiResponse<T>;
  } catch (error: unknown) {
    console.error(`API POST Fetch Error: ${url}`, error);
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
   try {
    const response = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
     if (!response.ok) {
        let errorData: Partial<ApiResponse<never>> = { error: response.statusText };
        try {
            errorData = await response.json();
        } catch { /* Ignore parsing error */ }
        console.error(`API PUT Error (${response.status}): ${url}`, errorData);
        return { success: false, error: errorData.error || response.statusText, message: errorData.message, details: errorData.details };
    }
    return await response.json() as ApiResponse<T>;
  } catch (error: unknown) {
    console.error(`API PUT Fetch Error: ${url}`, error);
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
   try {
    const response = await fetch(url, {
      method: 'DELETE',
    });
    // DELETE might return 204 No Content on success with empty body
    if (response.status === 204) {
      return { success: true }; // Return success without data
    }
    if (!response.ok) {
        let errorData: Partial<ApiResponse<never>> = { error: response.statusText };
        try {
            errorData = await response.json();
        } catch { /* Ignore parsing error */ }
      console.error(`API DELETE Error (${response.status}): ${url}`, errorData);
      return { success: false, error: errorData.error || response.statusText, message: errorData.message };
    }
     // If response is OK but not 204, try to parse JSON
    return await response.json() as ApiResponse<T>; 
  } catch (error: unknown) {
    console.error(`API DELETE Fetch Error: ${url}`, error);
    const message = error instanceof Error ? error.message : "Network request failed";
    return { success: false, error: message };
  }
} 