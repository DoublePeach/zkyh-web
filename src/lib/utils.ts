import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * @description 格式化字节大小为人类可读格式
 * @param bytes 字节数
 * @param decimals 小数点位数
 * @returns 格式化后的字符串
 */
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
}

/**
 * @description 格式化日期为人类可读格式
 * @param date 日期对象
 * @returns 格式化后的字符串
 */
export function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  
  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

/**
 * 将内容导出为HTML文件
 * @param content 要导出的内容
 * @param filename 要创建的文件名
 */
export function exportToHtml(content: string | object, filename: string = 'content') {
  // 如果内容是对象，转换为格式化的JSON
  const formattedContent = typeof content === 'string' 
    ? content 
    : JSON.stringify(content, null, 2);
  
  // 创建HTML内容
  const htmlContent = `
  <!DOCTYPE html>
  <html lang="zh-CN">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${filename}</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
          line-height: 1.6;
          padding: 20px;
          max-width: 1200px;
          margin: 0 auto;
          color: #333;
        }
        pre {
          background-color: #f5f5f5;
          padding: 15px;
          border-radius: 5px;
          overflow-x: auto;
          white-space: pre-wrap;
          font-family: Consolas, Monaco, 'Andale Mono', 'Ubuntu Mono', monospace;
          font-size: 14px;
        }
        h1 {
          border-bottom: 1px solid #eee;
          padding-bottom: 8px;
          margin-bottom: 20px;
        }
        .info {
          color: #666;
          margin-bottom: 20px;
        }
      </style>
    </head>
    <body>
      <h1>${filename}</h1>
      <div class="info">
        导出时间: ${new Date().toLocaleString('zh-CN')}
      </div>
      <pre>${formattedContent.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
    </body>
  </html>
  `;
  
  // 创建Blob对象
  const blob = new Blob([htmlContent], { type: 'text/html' });
  
  // 创建下载链接
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}.html`;
  
  // 触发下载
  document.body.appendChild(link);
  link.click();
  
  // 清理
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}
