/**
 * @description 清理日志文件脚本
 * @author 郝桃桃
 * @date 2024-10-01
 */

const fs = require('fs/promises');
const path = require('path');

const TIPS_DIR = path.resolve(process.cwd(), 'preparation-plan-tips');
const LOG_RETENTION_DAYS = process.argv[2] ? parseInt(process.argv[2]) : 3; // 默认保留最近3天的日志

async function cleanupLogs() {
  try {
    console.log(`清理超过 ${LOG_RETENTION_DAYS} 天的日志文件...`);
    
    // 检查目录是否存在
    try {
      await fs.access(TIPS_DIR);
    } catch (error) {
      console.log('日志目录不存在，无需清理');
      return;
    }
    
    // 获取目录中的所有文件和目录
    const files = await fs.readdir(TIPS_DIR);
    const now = Date.now();
    const retentionMs = LOG_RETENTION_DAYS * 24 * 60 * 60 * 1000;
    let deletedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    
    console.log(`发现 ${files.length} 个文件或目录，开始清理...`);
    
    // 处理每个文件
    for (const file of files) {
      if (file === 'tasks') {
        // 任务目录需要特殊处理
        try {
          const tasksDir = path.join(TIPS_DIR, 'tasks');
          const taskFiles = await fs.readdir(tasksDir);
          
          console.log(`处理任务目录，发现 ${taskFiles.length} 个任务文件`);
          
          // 清理任务目录中的旧文件
          for (const taskFile of taskFiles) {
            const taskPath = path.join(tasksDir, taskFile);
            const stats = await fs.stat(taskPath);
            
            if (now - stats.mtimeMs > retentionMs) {
              await fs.unlink(taskPath);
              deletedCount++;
              console.log(`- 已删除任务文件: ${taskFile}`);
            } else {
              skippedCount++;
            }
          }
        } catch (error) {
          console.error(`处理任务目录失败:`, error);
          errorCount++;
        }
        
        continue;
      }
      
      // 处理其他文件
      try {
        const filePath = path.join(TIPS_DIR, file);
        const stats = await fs.stat(filePath);
        
        if (now - stats.mtimeMs > retentionMs) {
          await fs.unlink(filePath);
          deletedCount++;
          console.log(`- 已删除文件: ${file}`);
        } else {
          skippedCount++;
        }
      } catch (error) {
        console.error(`处理文件 ${file} 失败:`, error);
        errorCount++;
      }
    }
    
    console.log('\n清理完成:');
    console.log(`- 已删除: ${deletedCount} 个文件`);
    console.log(`- 已保留: ${skippedCount} 个文件`);
    
    if (errorCount > 0) {
      console.log(`- 处理失败: ${errorCount} 个文件`);
    }
  } catch (error) {
    console.error('清理日志文件失败:', error);
    process.exit(1);
  }
}

// 执行清理
cleanupLogs()
  .then(() => {
    console.log('日志清理任务完成');
    process.exit(0);
  })
  .catch(error => {
    console.error('日志清理任务失败:', error);
    process.exit(1);
  }); 