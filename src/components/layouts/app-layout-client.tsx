'use client';

import { usePathname } from 'next/navigation';
import { BottomNav } from './bottom-nav';
import React from 'react';

interface AppLayoutClientProps {
  children: React.ReactNode;
}

export default function AppLayoutClient({ children }: AppLayoutClientProps) {
  const pathname = usePathname();
  
  // 判断当前路径是否为管理员页面
  const isAdminPage = pathname?.startsWith('/admin');
  
  return (
    <div className="flex flex-col min-h-screen">
      <main className={`flex-1 ${!isAdminPage ? 'pb-16' : ''}`}>
        {children}
      </main>
      {/* 只在非管理员页面显示底部导航栏 */}
      {!isAdminPage && <BottomNav />}
    </div>
  );
} 