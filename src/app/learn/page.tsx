'use client';

/**
 * @description 学习页面 - 重定向到备考规划列表页面
 * @author 郝桃桃
 * @date 2024-06-25
 */

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LearnPage() {
  const router = useRouter();
  
  // 页面加载时自动重定向到study-plans页面
  useEffect(() => {
    router.replace('/study-plans');
  }, [router]);
  
  // 返回空白页面，重定向期间显示
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      <p className="ml-3">正在重定向到学习中心...</p>
    </div>
  );
} 