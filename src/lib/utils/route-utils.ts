/**
 * @description 路由工具函数
 * @author 郝桃桃
 * @date 2024-06-17
 */

/**
 * @description 从上下文中安全获取路由参数
 * @param context 路由上下文对象
 * @returns 解析后的路由参数对象
 */
export async function getRouteParams<T extends Record<string, string>>(
  context: { params: Promise<T> }
): Promise<T> {
  return await context.params;
}

/**
 * @description 安全解析ID参数为数字
 * @param id 字符串形式的ID参数
 * @returns ID数值和是否为有效ID
 */
export function parseIdParam(id: string): { id: number; isValid: boolean } {
  const parsedId = parseInt(id);
  return {
    id: parsedId,
    isValid: !isNaN(parsedId) && parsedId > 0
  };
}

/**
 * @description 路由参数上下文接口
 */
export interface RouteParamsContext<T extends Record<string, string> = Record<string, string>> {
  params: Promise<T>;
} 