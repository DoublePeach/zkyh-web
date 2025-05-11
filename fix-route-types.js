#!/usr/bin/env node

/**
 * @description 修复Next.js 15.3.1的路由参数类型和Response类型
 * @author 郝桃桃
 * @date 2024-05-15
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// 获取所有的route.ts和route.tsx文件
exec('find src/app/api -name "route.ts" -o -name "route.tsx"', (error, stdout, stderr) => {
  if (error) {
    console.error(`执行错误: ${error}`);
    return;
  }
  
  const files = stdout.trim().split('\n');
  console.log(`找到 ${files.length} 个路由文件`);
  
  // 处理每个文件
  files.forEach(filePath => {
    try {
      let content = fs.readFileSync(filePath, 'utf8');
      
      // 检查文件内容
      const hasParamsType = content.includes('params: { id: string }') || 
                          content.includes('params: {id: string}');
      
      if (hasParamsType) {
        // 替换params类型为Promise<{id: string}>
        content = content.replace(/params: \{\s*id: string[^}]*\}/g, 'params: Promise<{ id: string }>');
        
        // 检查是否已经正确处理了await params
        if (!content.includes('await params')) {
          // 替换 params.id 为 (await params).id 或 await params 然后解构
          content = content.replace(/const id = params\.id;/g, 'const { id } = await params;');
          content = content.replace(/params\.id/g, '(await params).id');
        }
      }
      
      // 替换NextResponse.json为标准Response
      content = content.replace(/NextResponse\.json\(\s*([^,)]+)(?:,\s*\{\s*status:\s*(\d+)\s*\})?\s*\)/g, (match, jsonObj, statusCode) => {
        const status = statusCode || '200';
        return `new Response(JSON.stringify(${jsonObj}), { 
      status: ${status},
      headers: { 'Content-Type': 'application/json' }
    })`;
      });
      
      // 写回文件
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`已处理: ${filePath}`);
    } catch (err) {
      console.error(`处理文件 ${filePath} 时发生错误:`, err);
    }
  });
  
  console.log('处理完成!');
}); 