/**
 * @description 服务模块，用于管理异步生成备考规划的任务状态。
 *              任务状态通过文件系统存储。
 * @author 郝桃桃
 * @date 2024-07-15 // Assuming today's date, please adjust if necessary
 */

import * as fs from 'fs';
import * as path from 'path';

// 任务存储的相对路径，相对于项目根目录
const TASK_FILES_SUBDIR = 'preparation-plan-tips/tasks';

// 任务存储的绝对路径
const TASKS_DIR = path.join(process.cwd(), TASK_FILES_SUBDIR);

// 确保任务存储目录存在
try {
  if (!fs.existsSync(TASKS_DIR)) {
    fs.mkdirSync(TASKS_DIR, { recursive: true });
    console.log(`任务存储目录已创建: ${TASKS_DIR}`);
  }
} catch (error) {
  console.error(`创建任务存储目录失败 (${TASKS_DIR}):`, error);
  // 如果目录创建失败，后续操作可能会失败，这里可以考虑抛出致命错误或采取其他措施
}

/**
 * @description 定义生成任务的结构。
 */
export type GenerationTask = {
  id: string;                        // 任务唯一标识符
  userId: number | string;           // 关联的用户ID
  status: 'pending' | 'processing' | 'completed' | 'failed'; // 任务当前状态
  progress: number;                  // 任务完成进度 (0-100)
  startTime: number;                 // 任务开始时间戳 (Date.now())
  planId?: string | number;         // 如果成功完成，关联的备考规划ID
  error?: string;                     // 如果失败，错误信息
  formData?: any;                     // (可选) 存储触发任务的原始formData，用于调试或重试
};

/**
 * @description 将生成任务的状态保存到文件系统中。
 * @param {GenerationTask} task - 需要保存的任务对象。
 * @returns {void}
 * @throws {Error} 如果写入文件失败。
 */
export function saveTask(task: GenerationTask): void {
  try {
    const filePath = path.join(TASKS_DIR, `${task.id}.json`);
    fs.writeFileSync(filePath, JSON.stringify(task, null, 2), 'utf8');
    console.log(`任务 (${task.id}) 已保存到: ${filePath}`);
  } catch (error) {
    console.error(`保存任务 (${task.id}) 到文件失败:`, error);
    throw new Error(`保存任务 (${task.id}) 处理失败`);
  }
}

/**
 * @description 从文件系统中获取指定ID的生成任务状态。
 * @param {string} taskId - 需要获取的任务ID。
 * @returns {GenerationTask | null} - 任务对象，如果找不到或读取失败则返回null。
 */
export function getTask(taskId: string): GenerationTask | null {
  try {
    const filePath = path.join(TASKS_DIR, `${taskId}.json`);
    if (!fs.existsSync(filePath)) {
      console.warn(`尝试获取任务 (${taskId}) 但文件不存在: ${filePath}`);
      return null;
    }
    const taskData = fs.readFileSync(filePath, 'utf8');
    console.log(`任务 (${taskId}) 从文件加载成功: ${filePath}`);
    return JSON.parse(taskData) as GenerationTask;
  } catch (error) {
    console.error(`获取任务 (${taskId}) 从文件失败:`, error);
    return null; // 返回null表示获取失败或任务不存在
  }
}

/**
 * @description 更新文件系统中已存在的生成任务状态。
 * @param {string} taskId - 需要更新的任务ID。
 * @param {Partial<GenerationTask>} updates - 需要更新的字段和值。
 * @returns {boolean} - 如果任务存在并成功更新则返回true，否则返回false。
 * @throws {Error} 如果更新过程中发生错误（例如任务不存在，或读取/保存任务失败）。
 */
export function updateTask(taskId: string, updates: Partial<Omit<GenerationTask, 'id'>>): boolean {
  console.log(`尝试更新任务 (${taskId})，更新内容:`, updates);
  const task = getTask(taskId);
  if (!task) {
    // 如果任务不存在，则无法更新，抛出错误或返回false
    // 根据当前实现，getTask在找不到文件时返回null，这里也返回false
    console.warn(`尝试更新任务 (${taskId}) 但任务未找到。`);
    return false; 
  }
  
  const updatedTask = { ...task, ...updates, updatedAt: Date.now() }; // 添加updatedAt时间戳
  
  try {
    saveTask(updatedTask);
    console.log(`任务 (${taskId}) 更新成功。`);
    return true;
  } catch (error) {
    // saveTask会抛出错误，这里直接再次抛出，让调用者处理
    console.error(`在 updateTask 中保存任务 (${taskId}) 时失败:`, error);
    throw error; 
  }
}

/**
 * @description 删除指定的任务文件。
 * @param {string} taskId - 需要删除的任务ID。
 * @returns {Promise<void>}
 * @throws {Error} 如果删除文件失败。
 */
export async function deleteTaskFile(taskId: string): Promise<void> {
  try {
    const filePath = path.join(TASKS_DIR, `${taskId}.json`);
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
      console.log(`任务文件 (${taskId}) 已成功删除: ${filePath}`);
    } else {
      console.warn(`尝试删除任务文件 (${taskId}) 但文件不存在: ${filePath}`);
    }
  } catch (error) {
    console.error(`删除任务文件 (${taskId}) 失败:`, error);
    throw new Error(`删除任务文件 (${taskId}) 处理失败`);
  }
}

/**
 * @description (可选) 清理过期的任务文件。
 * @param {number} maxAgeInMs - 任务文件的最大存留时间（毫秒）。超过此时间的任务文件将被删除。
 * @returns {Promise<void>}
 */
export async function cleanupOldTasks(maxAgeInMs: number): Promise<void> {
  try {
    const files = await fs.promises.readdir(TASKS_DIR);
    for (const file of files) {
      if (file.endsWith('.json')) {
        const filePath = path.join(TASKS_DIR, file);
        try {
          const stats = await fs.promises.stat(filePath);
          if (Date.now() - stats.mtimeMs > maxAgeInMs) {
            await fs.promises.unlink(filePath);
            console.log(`已清理过期任务文件: ${file}`);
          }
        } catch (statError) {
          console.error(`获取文件状态失败 (${file}):`, statError);
          // 可以选择删除无法读取状态的文件
          // await fs.promises.unlink(filePath); 
        }
      }
    }
  } catch (error) {
    console.error('清理旧任务时出错:', error);
  }
} 