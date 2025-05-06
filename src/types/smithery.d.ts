/**
 * @description Smithery SDK 类型声明
 * @author 郝桃桃
 * @date 2024-08-24
 */

declare module '@smithery/sdk' {
  /**
   * 创建Smithery URL函数
   * @param serverUrl 服务器URL
   * @param config 配置对象
   * @param apiKey API密钥
   * @returns 完整的Smithery URL
   */
  export function createSmitheryUrl(
    serverUrl: string,
    config: Record<string, any>,
    apiKey: string
  ): string;
} 