/**
 * @description 备考规划生成状态管理
 * @author 郝桃桃
 * @date 2024-05-09
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { SurveyFormData } from '@/types/survey';

export type GenerationStatus = 'idle' | 'generating' | 'success' | 'error';

interface PlanGenerationState {
  // 状态
  status: GenerationStatus;
  progress: number;
  startTime: number | null;
  estimatedTimeMs: number;
  planId: string | null;
  formData: SurveyFormData | null;
  error: string | null;
  
  // 操作
  startGeneration: (formData: SurveyFormData) => void;
  updateProgress: (progress: number) => void;
  completePlanGeneration: (planId: string) => void;
  failPlanGeneration: (error: string) => void;
  resetState: () => void;
}

const initialState = {
  status: 'idle' as GenerationStatus,
  progress: 0,
  startTime: null,
  estimatedTimeMs: 3 * 60 * 1000, // 默认3分钟
  planId: null,
  formData: null,
  error: null,
};

export const usePlanGenerationStore = create<PlanGenerationState>()(
  persist(
    (set) => ({
      ...initialState,
      
      // 开始生成
      startGeneration: (formData: SurveyFormData) => set({
        status: 'generating',
        progress: 0,
        startTime: Date.now(),
        formData,
        error: null
      }),
      
      // 更新进度
      updateProgress: (progress: number) => set((state) => ({
        progress: Math.min(Math.max(0, progress), 99), // 最大99，留1%给完成步骤
        // 如果进度达到99%但还未完成，不更新状态，让动画继续
        status: state.status === 'generating' ? 'generating' : state.status
      })),
      
      // 完成生成
      completePlanGeneration: (planId: string) => set({
        status: 'success',
        progress: 100,
        planId
      }),
      
      // 生成失败
      failPlanGeneration: (error: string) => set({
        status: 'error',
        error
      }),
      
      // 重置状态
      resetState: () => set(initialState)
    }),
    {
      name: 'plan-generation-state',
      // 只持久化部分状态，避免不必要的存储
      partialize: (state) => ({
        status: state.status,
        progress: state.progress,
        startTime: state.startTime,
        planId: state.planId,
        formData: state.formData,
      }),
    }
  )
); 