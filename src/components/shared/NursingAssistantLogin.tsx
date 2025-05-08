/**
 * @description 护理助手APP自动登录组件 - 检测URL参数并自动发起登录
 * @author 郝桃桃
 * @date 2024-09-29
 */
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/use-auth-store';
import { toast } from 'sonner';

export default function NursingAssistantLogin() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { setUser, isAuthenticated } = useAuthStore();
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    // 判断是否从护理助手APP跳转过来
    const nursingAssistantUserId = searchParams.get('nursing_assistant_user_id');
    
    const processNursingAssistantLogin = async (userId: string) => {
      if (isProcessing || isAuthenticated) return;
      
      setIsProcessing(true);
      
      try {
        // 显示提示
        toast.info('正在验证护理助手账号...');
        
        // 调用登录接口
        const response = await fetch('/api/auth/nursing-assistant', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId }),
        });
        
        const data = await response.json();
        
        if (data.success) {
          toast.success('登录成功！欢迎回来');
          
          // 更新认证状态
          setUser(data.user);
          
          // 跳转到主页或个人页面
          router.push('/profile');
        } else {
          toast.error(`登录失败: ${data.error || '未知错误'}`);
        }
      } catch (error) {
        console.error('护理助手登录处理异常:', error);
        toast.error('登录处理出错，请稍后再试');
      } finally {
        setIsProcessing(false);
      }
    };
    
    // 如果有护理助手用户ID参数且未登录，自动执行登录
    if (nursingAssistantUserId && !isAuthenticated) {
      processNursingAssistantLogin(nursingAssistantUserId);
    }
  }, [searchParams, isAuthenticated, router, setUser, isProcessing]);

  // 这是一个无UI组件，只处理逻辑
  return null;
} 