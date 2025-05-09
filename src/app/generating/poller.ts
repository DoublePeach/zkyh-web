/**
 * @description 轮询服务，用于获取生成任务的状态
 * @author 郝桃桃
 * @date 2024-05-09
 */
import { getGenerationTaskStatus } from '@/lib/db-client';
import { usePlanGenerationStore } from '@/store/use-plan-generation-store';

/**
 * 轮询任务状态服务类
 */
export class TaskPoller {
  private taskId: string;
  private interval: number;
  private timer: NodeJS.Timeout | null = null;
  private isPolling: boolean = false;
  private errorCount: number = 0;
  private maxErrors: number = 5; // 最大连续错误次数
  
  /**
   * 构造函数
   * @param taskId 任务ID
   * @param interval 轮询间隔（毫秒）
   * @param maxErrors 最大连续错误次数
   */
  constructor(taskId: string, interval: number = 5000, maxErrors: number = 5) {
    this.taskId = taskId;
    this.interval = interval;
    this.maxErrors = maxErrors;
  }
  
  /**
   * 开始轮询
   */
  start() {
    if (this.isPolling) return;
    
    this.isPolling = true;
    this.errorCount = 0; // 重置错误计数
    this.poll();
    
    // 设置定时器
    this.timer = setInterval(() => {
      this.poll();
    }, this.interval);
  }
  
  /**
   * 停止轮询
   */
  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.isPolling = false;
  }
  
  /**
   * 执行一次轮询
   */
  private async poll() {
    if (!this.isPolling) return;
    
    try {
      const status = await getGenerationTaskStatus(this.taskId);
      
      // 成功获取状态，重置错误计数
      this.errorCount = 0;
      
      // 更新状态
      const store = usePlanGenerationStore.getState();
      
      // 更新进度
      if (status.progress !== undefined) {
        store.updateProgress(status.progress);
      }
      
      // 处理完成状态
      if (status.status === 'completed' && status.planId) {
        store.completePlanGeneration(String(status.planId));
        this.stop(); // 完成后停止轮询
      }
      
      // 处理失败状态
      if (status.status === 'failed') {
        store.failPlanGeneration(status.error || '生成失败');
        this.stop(); // 失败后停止轮询
      }
    } catch (error) {
      this.errorCount++;
      console.error(`轮询任务状态失败 (${this.errorCount}/${this.maxErrors}):`, error);
      
      // 如果连续错误次数超过最大值，停止轮询并通知用户
      if (this.errorCount >= this.maxErrors) {
        console.error(`连续${this.maxErrors}次获取任务状态失败，停止轮询`);
        const store = usePlanGenerationStore.getState();
        store.failPlanGeneration('获取任务状态失败，请刷新页面重试');
        this.stop();
      }
    }
  }
}

/**
 * 创建任务轮询器
 * @param taskId 任务ID
 * @param interval 轮询间隔（毫秒）
 */
export function createTaskPoller(taskId: string, interval?: number): TaskPoller {
  return new TaskPoller(taskId, interval);
} 