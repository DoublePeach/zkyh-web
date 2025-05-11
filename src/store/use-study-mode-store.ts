/**
 * @description 学习模式状态管理
 * @author 郝桃桃
 * @date 2024-05-10
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { StudyMode } from '@/db/schema/users';
import { getUserStudyMode, updateUserStudyMode } from '@/lib/services/user-service';
import { useAuthStore } from './use-auth-store';

// 学习模式配置
export const studyModeConfig = {
  hard: {
    name: '学霸模式',
    icon: '🏅',
    color: 'text-pink-700',
    description: '覆盖100%知识点，冲刺高分！'
  },
  hero: {
    name: '通关模式',
    icon: '🏆',
    color: 'text-pink-600',
    description: '弱化低频考点，稳中取胜！'
  },
  normal: {
    name: '基础模式',
    icon: '🥇',
    color: 'text-pink-500',
    description: '核心高频考点及格万岁！'
  },
  easy: {
    name: '简单模式',
    icon: '🎖️',
    color: 'text-pink-400',
    description: '佛系备考～通过率可能不足30%'
  }
};

interface StudyModeState {
  currentMode: StudyMode;
  isLoading: boolean;
  
  // 操作
  setMode: (mode: StudyMode) => Promise<boolean>;
  loadUserMode: (userId: number | string) => Promise<void>;
}

export const useStudyModeStore = create<StudyModeState>()(
  persist(
    (set, get) => ({
      currentMode: 'normal', // 默认模式
      isLoading: false,
      
      // 设置学习模式
      setMode: async (mode) => {
        const auth = useAuthStore.getState();
        
        if (!auth.user?.id) {
          console.error('无法更新学习模式：用户未登录');
          return false;
        }
        
        set({ isLoading: true });
        
        try {
          const success = await updateUserStudyMode(auth.user.id, mode);
          
          if (success) {
            set({ currentMode: mode });
          }
          
          return success;
        } catch (error) {
          console.error('更新学习模式失败:', error);
          return false;
        } finally {
          set({ isLoading: false });
        }
      },
      
      // 加载用户模式
      loadUserMode: async (userId) => {
        set({ isLoading: true });
        
        try {
          const mode = await getUserStudyMode(userId);
          set({ currentMode: mode });
        } catch (error) {
          console.error('加载用户学习模式失败:', error);
          // 保持默认模式
        } finally {
          set({ isLoading: false });
        }
      }
    }),
    {
      name: 'study-mode-store',
      partialize: (state) => ({ currentMode: state.currentMode }),
    }
  )
); 