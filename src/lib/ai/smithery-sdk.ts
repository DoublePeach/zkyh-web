/**
 * @description 本地实现的Smithery SDK功能
 * @author 郝桃桃
 * @date 2024-08-24
 */

/**
 * 创建Smithery URL
 * @param serverUrl MCP服务器URL
 * @param config 连接配置
 * @param apiKey API密钥
 * @returns 完整的URL
 */
export function createSmitheryUrl(
  serverUrl: string,
  config: Record<string, any>,
  apiKey: string
): string {
  // 将配置序列化为base64
  const configBase64 = Buffer.from(JSON.stringify(config)).toString('base64');
  
  // 构建URL
  let url = `${serverUrl}?config=${encodeURIComponent(configBase64)}`;
  
  // 如果有API密钥，添加到URL中
  if (apiKey) {
    url += `&key=${encodeURIComponent(apiKey)}`;
  }
  
  return url;
} 