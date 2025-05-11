'use client';

/**
 * @description 备考规划生成状态组件 - 显示在首页，链接到生成进度页
 * @author 郝桃桃
 * @date 2024-05-09
 */
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Progress } from '@/components/ui/progress';
import { Brain } from 'lucide-react';
import { usePlanGenerationStore } from '@/store/use-plan-generation-store';

export default function PlanGenerationStatus() {
  const { status, progress } = usePlanGenerationStore();
  const [visible, setVisible] = useState(false);
  
  // 只在生成状态时显示
  useEffect(() => {
    if (status === 'generating') {
      setVisible(true);
    } else {
      // 如果状态不是生成中，等待一会再隐藏，让用户有时间看到成功或失败消息
      const timeout = setTimeout(() => {
        setVisible(false);
      }, 5000);
      
      return () => clearTimeout(timeout);
    }
  }, [status]);
  
  // 如果不可见，不渲染任何内容
  if (!visible) return null;
  
  // 根据状态显示不同的内容
  let statusContent;
  switch (status) {
    case 'generating':
      // 显示生成中状态
      statusContent = (
        <>
          <div className="flex-none mr-3">
            <div className="animate-pulse bg-indigo-100 p-2 rounded-full">
              <Brain className="h-6 w-6 text-indigo-600" />
            </div>
          </div>
          <div className="flex-1">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-medium">正在生成备考规划</span>
              <span className="text-xs font-medium">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2 w-full" />
          </div>
        </>
      );
      break;
      
    case 'success':
      // 显示成功状态
      statusContent = (
        <>
          <div className="flex-none mr-3">
            <div className="bg-green-100 p-2 rounded-full">
              <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          <div className="flex-1">
            <span className="font-medium">备考规划已生成成功!</span>
          </div>
        </>
      );
      break;
      
    case 'error':
      // 显示错误状态
      statusContent = (
        <>
          <div className="flex-none mr-3">
            <div className="bg-red-100 p-2 rounded-full">
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          </div>
          <div className="flex-1">
            <span className="font-medium">生成规划时出错</span>
          </div>
        </>
      );
      break;
      
    default:
      return null;
  }
  
  return (
    <Link href="/generating" className="block">
      <div className="fixed bottom-4 right-4 z-50 bg-white shadow-lg rounded-lg p-4 w-80 flex items-center border border-gray-200 hover:shadow-xl transition-shadow">
        {statusContent}
      </div>
    </Link>
  );
} 