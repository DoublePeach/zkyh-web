'use client';

/**
 * @description 首页
 * @author 郝桃桃
 * @date 2023-10-01
 */

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/use-auth-store';
import { BookOpen, BarChart, Trophy, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { getUserStudyPlans } from '@/lib/db-client';

export default function HomePage() {
  const { isAuthenticated, user } = useAuthStore();
  const [studyPlans, setStudyPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // 获取用户的备考规划
  useEffect(() => {
    const fetchStudyPlans = async () => {
      if (!isAuthenticated || !user) return;
      
      try {
        setLoading(true);
        const plans = await getUserStudyPlans(user.id);
        setStudyPlans(plans);
      } catch (error) {
        console.error('获取备考规划失败:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchStudyPlans();
  }, [isAuthenticated, user]);
  
  return (
    <main className="min-h-screen bg-gray-50">
      {/* 顶部导航 */}
      <header className="bg-white py-4 px-4 shadow-sm">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 relative">
              <Image 
                src="/logo.png" 
                alt="Logo" 
                width={32} 
                height={32} 
                className="object-contain"
                onError={(e) => {
                  e.currentTarget.src = 'data:image/svg+xml;charset=utf-8,%3Csvg xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22 width%3D%2232%22 height%3D%2232%22 viewBox%3D%220 0 24 24%22 fill%3D%22none%22 stroke%3D%22%23000%22 stroke-width%3D%221%22 stroke-linecap%3D%22round%22 stroke-linejoin%3D%22round%22%3E%3Crect x%3D%223%22 y%3D%223%22 width%3D%2218%22 height%3D%2218%22 rx%3D%222%22 ry%3D%222%22%3E%3C%2Frect%3E%3Cline x1%3D%229%22 y1%3D%223%22 x2%3D%229%22 y2%3D%2221%22%3E%3C%2Fline%3E%3C%2Fsvg%3E';
                }}
              />
            </div>
            <h1 className="text-xl font-bold text-gray-900">医卫职称备考助手</h1>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 text-gray-600">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
              </svg>
            </button>
            <button className="p-2 text-gray-600">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3"></circle>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1Z"></path>
              </svg>
            </button>
          </div>
        </div>
      </header>
      
      {/* 主要内容 */}
      <div className="container mx-auto px-4 py-6">
        {/* 顶部横幅 */}
        <div className="bg-indigo-500 text-white rounded-lg p-6 mb-6">
          <div className="max-w-md">
            <h2 className="text-2xl font-bold mb-2">开启您的职称晋升之旅</h2>
            <p className="mb-6">为卫生专业技术人员提供个性化备考规划</p>
            <Link href="/survey">
              <Button className="bg-white text-indigo-600 hover:bg-gray-100 hover:text-indigo-700">
                立即开始备考规划
              </Button>
            </Link>
          </div>
        </div>
        
        {/* 备考概况卡片 */}
        {isAuthenticated && studyPlans.length > 0 ? (
          <Card className="mb-6">
            <CardContent className="p-6">
              <h3 className="text-lg font-medium mb-4">我的备考概况</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-sm text-gray-500">活跃备考方案</p>
                  <p className="text-3xl font-bold text-indigo-600">{studyPlans.filter(p => p.isActive).length}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-500">累计备考天数</p>
                  <p className="text-3xl font-bold text-indigo-600">
                    {Math.floor((new Date().getTime() - new Date(studyPlans[0]?.startDate || new Date()).getTime()) / (1000 * 60 * 60 * 24))}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-500">距考试天数</p>
                  <p className="text-3xl font-bold text-indigo-600">
                    {Math.floor((new Date(studyPlans[0]?.endDate || new Date()).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))}
                  </p>
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <Link href="/learn">
                  <Button variant="outline" className="text-indigo-600 border-indigo-600">
                    继续学习
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : isAuthenticated ? (
          loading ? (
            <Card className="mb-6">
              <CardContent className="p-6 flex items-center justify-center">
                <div className="animate-spin w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full"></div>
                <span className="ml-2 text-gray-500">加载中...</span>
              </CardContent>
            </Card>
          ) : (
            <Card className="mb-6">
              <CardContent className="p-6 text-center">
                <p className="text-gray-600 mb-4">您还没有创建备考规划</p>
                <Link href="/survey">
                  <Button className="bg-indigo-600 hover:bg-indigo-700">
                    开始创建备考规划
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )
        ) : null}
        
        {/* 核心功能 */}
        <div>
          <h3 className="text-lg font-medium mb-4">核心功能</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Link href="/survey" className="no-underline">
              <Card className="h-full hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col items-center text-center">
                    <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mb-3">
                      <BarChart className="h-8 w-8 text-blue-500" />
                    </div>
                    <h4 className="text-lg font-semibold mb-2">个性化规划</h4>
                    <p className="text-sm text-gray-600">根据您的情况定制备考方案</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
            
            <Link href="/learn" className="no-underline">
              <Card className="h-full hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col items-center text-center">
                    <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center mb-3">
                      <BookOpen className="h-8 w-8 text-purple-500" />
                    </div>
                    <h4 className="text-lg font-semibold mb-2">知识学习</h4>
                    <p className="text-sm text-gray-600">系统学习专业知识</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
            
            <Link href={studyPlans.length > 0 ? `/study-plan/${studyPlans[0]?.id}` : "/survey"} className="no-underline">
              <Card className="h-full hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col items-center text-center">
                    <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-3">
                      <Clock className="h-8 w-8 text-green-500" />
                    </div>
                    <h4 className="text-lg font-semibold mb-2">进度跟踪</h4>
                    <p className="text-sm text-gray-600">查看学习进度和完成情况</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
