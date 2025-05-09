'use client';

import { usePathname } from 'next/navigation';
import { DrawerNav } from './drawer-nav';
import React, { useEffect } from 'react';
import PlanGenerationStatus from '@/components/shared/PlanGenerationStatus';

interface AppLayoutClientProps {
  children: React.ReactNode;
}

export default function AppLayoutClient({ children }: AppLayoutClientProps) {
  const pathname = usePathname();
  
  // 判断当前路径是否为管理员页面或认证页面
  const isAdminPage = pathname?.startsWith('/admin');
  const isAuthPage = pathname?.startsWith('/login') || pathname?.startsWith('/register');
  const isGeneratingPage = pathname?.startsWith('/generating');
  
  // 是否显示抽屉式导航
  const showNav = !isAdminPage && !isAuthPage;
  
  // 是否显示生成状态组件（在生成页面不需要显示）
  const showGenerationStatus = !isGeneratingPage;
  
  // 确保页面可以正常滚动
  useEffect(() => {
    // 确保body能够滚动，覆盖可能的hidden设置
    document.body.style.overflow = 'auto';
    document.body.style.overflowY = 'auto';
    
    return () => {
      // 清理函数，不需要做任何操作
    };
  }, [pathname]);
  
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* 顶部导航栏，只在非管理员和非认证页面显示 */}
      {showNav && <DrawerNav />}
      
      {/* 主内容区 */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
      
      {/* 备考规划生成状态 */}
      {showGenerationStatus && <PlanGenerationStatus />}
    </div>
  );
} 