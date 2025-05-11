'use client';

/**
 * @description 首页
 * @author 郝桃桃
 * @date 2023-10-01
 */

import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/use-auth-store';
import { useStudyModeStore, studyModeConfig } from '@/store/use-study-mode-store';
import { BookOpen, Clock, ArrowRight, Sparkles, BookMarked, Calendar, GraduationCap, Award, Target } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useEffect, useState, Suspense, useCallback } from 'react';
import { getUserStudyPlans } from '@/lib/db-client';
import type { studyPlans } from '@/db/schema'; 
import type { InferSelectModel } from 'drizzle-orm'; 
import { useRouter } from 'next/navigation';

type StudyPlan = InferSelectModel<typeof studyPlans>;

// 格式化目标职称显示
const extractTargetTitle = (title: string | undefined | null): string => {
  if (!title) return '护理职称';
  
  // 尝试提取括号中的内容，如"护理职称(初级护师)备考规划"
  const matchBrackets = title.match(/\((.*?)\)/);
  if (matchBrackets && matchBrackets[1]) {
    return matchBrackets[1];
  }
  
  // 尝试提取"职称"后面的内容
  const matchTitle = title.match(/职称.*?([\u4e00-\u9fa5]{2,4})/);
  if (matchTitle && matchTitle[1]) {
    return matchTitle[1];
  }
  
  // 直接寻找常见职称名称
  const commonTitles = ['初级护师', '主管护师', '副主任护师', '主任护师', '初级医师', '主治医师', '副主任医师', '主任医师'];
  for (const commonTitle of commonTitles) {
    if (title.includes(commonTitle)) {
      return commonTitle;
    }
  }
  
  // 如果无法提取，返回短一些的标题内容
  return title.slice(0, 8);
};

// 带Suspense的路由提供器
function RouterProvider({ children }: { children: (router: ReturnType<typeof useRouter>) => React.ReactNode }) {
  const router = useRouter();
  return <>{children(router)}</>;
}

export default function HomePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-pink-400 border-t-transparent rounded-full animate-spin mr-2"></div>
        <p>加载中...</p>
      </div>
    }>
      <RouterProvider>
        {(router) => <HomePageContent router={router} />}
      </RouterProvider>
    </Suspense>
  );
}

function HomePageContent({ router }: { router: ReturnType<typeof useRouter> }) {
  const { isAuthenticated, user } = useAuthStore();
  const { currentMode, loadUserMode } = useStudyModeStore();
  const [studyPlans, setStudyPlans] = useState<StudyPlan[]>([]);
  const [loading, setLoading] = useState(false);

  // 路由导航函数，通过router.push进行跳转，避免Link组件问题
  const handleNavigation = useCallback((href: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    // 使用setTimeout确保在React渲染周期之外执行导航，避免状态更新干扰
    setTimeout(() => {
      router.push(href);
    }, 10);
  }, [router]);
  
  // 获取用户的备考规划和学习模式
  useEffect(() => {
    const fetchStudyPlans = async () => {
      if (!isAuthenticated || !user) return;
      
      try {
        setLoading(true);
        const plans = await getUserStudyPlans(user.id);
        setStudyPlans(plans);
        
        // 加载用户学习模式
        await loadUserMode(user.id);
      } catch (error) {
        console.error('获取备考规划失败：', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchStudyPlans();
    
    // 如果用户已登录，不显示自动登录模态框
    // if (isAuthenticated) {
    //   setShowAutoLogin(false);
    // }
  }, [isAuthenticated, user, loadUserMode]);
  
  // 备考概况数据
  const studyData = {
    activeStudyPlans: studyPlans.length, // 活跃备考方案数量，使用实际的规划数量
    completedDays: 0,    // 已完成天数
    daysUntilExam: 340   // 距离考试天数
  };
  
  // 获取当前备考规划（最新的规划）
  const currentPlan = studyPlans.length > 0 ? studyPlans[0] : null;
  
  return (
    <main className="min-h-screen bg-gray-50">
      {/* 主要内容 */}
      <div className="container mx-auto px-4 py-6">
        {/* 顶部内容 - 根据用户是否有备考规划显示不同内容 */}
        {loading ? (
          <div className="bg-white rounded-xl p-6 mb-6 shadow-md flex justify-center items-center">
            <div className="w-6 h-6 border-2 border-pink-400 border-t-transparent rounded-full animate-spin mr-2"></div>
            <p>加载中...</p>
          </div>
        ) : (
          <>
            {/* 如果用户没有备考规划，显示开启旅程横幅 */}
            {(!isAuthenticated || studyPlans.length === 0) && (
              <div className="bg-[#FFEEEE] text-pink-800 rounded-xl p-6 mb-6 shadow-md">
                <h1 className="text-2xl font-bold mb-2">开启您的职称通关之旅</h1>
                <p className="text-pink-700 mb-2">当前版本仅包含初级护师的备考功能, 欢迎您的首次体验!</p>
                <p className="text-pink-700 mb-4">我们会根据您的学习时间安排合理分配任务</p>
                <p className="text-xs text-pink-600 mb-2">您的真实感受和宝贵建议对我们的产品研发团队至关重要~</p>
                <p className="text-xs text-pink-600 mb-6">主管护师/副主任护师/主任护师... 的职称晋升规划功能正在紧锣密鼓的开发中, 敬请期待.</p>
                <div className="flex flex-wrap gap-4">
                  <Button
                    className="bg-pink-600 text-white hover:bg-pink-700"
                    onClick={(e) => handleNavigation('/survey', e)}
                  >
                    立即开始备考规划
                  </Button>
                  <Button
                    variant="outline"
                    className="bg-transparent border-pink-600 text-pink-600 hover:bg-pink-50"
                    onClick={(e) => handleNavigation('/study-plans', e)}
                  >
                    查看我的规划
                  </Button>
                </div>
              </div>
            )}
            
            {/* 备考概况卡片 - 只在用户已登录且有备考规划时显示 */}
            {isAuthenticated && studyPlans.length > 0 && (
              <Card className="mb-6 bg-white shadow border-none overflow-hidden">
                <CardContent className="p-0">
                  {/* 卡片顶部标题栏 */}
                  <div className="p-5 border-b border-gray-100 flex justify-between items-center">
                    <h2 className="text-xl font-bold flex items-center">
                      <Award className="h-5 w-5 text-pink-500 mr-2" />
                      我的备考概况
                    </h2>
                    <Button
                      variant="link"
                      className="text-pink-500 text-sm flex items-center p-0 hover:no-underline hover:text-pink-600"
                      onClick={(e) => handleNavigation('/study-plans', e)}
                    >
                      查看全部规划 <ArrowRight className="ml-1 h-4 w-4" />
                    </Button>
                  </div>
                  
                  {/* 卡片主体内容 */}
                  <div className="p-5">
                    {/* 学习目标和进度摘要 */}
                    <div className="flex items-center justify-between mb-5 bg-pink-50 p-3 rounded-lg">
                      <div className="flex items-center">
                        <div className="bg-pink-100 p-2 rounded-full mr-3">
                          <GraduationCap className="h-6 w-6 text-pink-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">当前备考目标</p>
                          <p className="font-semibold text-lg text-gray-900">
                            {extractTargetTitle(currentPlan?.title)}
                          </p>
                        </div>
                      </div>
                      
                      {/* 学习模式显示 */}
                      <div className="flex items-center">
                        <div className={`flex items-center px-3 py-1 rounded-full border ${studyModeConfig[currentMode].color.replace('text-', 'border-')}`}>
                          <span className="mr-1">{studyModeConfig[currentMode].icon}</span>
                          <span className={`text-sm font-medium ${studyModeConfig[currentMode].color}`}>
                            {studyModeConfig[currentMode].name}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* 重要指标区域 */}
                    <div className="grid grid-cols-2 gap-4 mb-5">
                      <div className="bg-amber-50 p-3 rounded-lg flex items-center">
                        <div className="bg-amber-100 p-2 rounded-full mr-3">
                          <Clock className="h-5 w-5 text-amber-600" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">累计备考天数</p>
                          <p className="font-bold text-xl text-amber-600">{studyData.completedDays}天</p>
                        </div>
                      </div>
                      
                      <div className="bg-blue-50 p-3 rounded-lg flex items-center">
                        <div className="bg-blue-100 p-2 rounded-full mr-3">
                          <Target className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">距离考试还有</p>
                          <p className="font-bold text-xl text-blue-600">{studyData.daysUntilExam}天</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* 继续学习按钮 */}
                    <Button
                      className="w-full gap-2 py-5 bg-pink-600 hover:bg-pink-700"
                      size="lg"
                      onClick={(e) => handleNavigation(currentPlan ? `/study-plan/${currentPlan.id}/phase/1` : "/study-plans", e)}
                    >
                      <BookOpen className="h-5 w-5" />
                      继续学习
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
        
        {/* 核心功能 */}
        <h2 className="text-xl font-bold mb-4">核心功能</h2>
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div onClick={(e) => handleNavigation(isAuthenticated && studyPlans.length > 0 ? "/study-plans" : "/survey", e)}>
            <Card className="bg-pink-50 border-none shadow-sm hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-6 flex flex-col items-center text-center">
                <div className="bg-pink-100 p-3 rounded-full mb-3">
                  <BookMarked className="h-6 w-6 text-pink-600" />
                </div>
                <h3 className="font-medium mb-1">个性化规划</h3>
                <p className="text-sm text-gray-600">根据您的基础定制备考计划</p>
              </CardContent>
            </Card>
          </div>
          
          <div onClick={(e) => handleNavigation("/learn", e)}>
            <Card className="bg-purple-50 border-none shadow-sm hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-6 flex flex-col items-center text-center">
                <div className="bg-purple-100 p-3 rounded-full mb-3">
                  <Sparkles className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="font-medium mb-1">知识学习</h3>
                <p className="text-sm text-gray-600">系统掌握专业知识点</p>
              </CardContent>
            </Card>
          </div>
        </div>
        
        {/* 最近活动 */}
        <h2 className="text-xl font-bold mb-4">最近活动</h2>
        <div className="bg-white p-12 rounded-lg border flex flex-col items-center justify-center text-center">
          <Calendar className="h-12 w-12 text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-700 mb-2">暂无学习记录</h3>
          <p className="text-gray-500 mb-4">开始学习来记录您的备考进度</p>
          <Button
            className="bg-pink-600 hover:bg-pink-700"
            onClick={(e) => handleNavigation(isAuthenticated && studyPlans.length > 0 ? "/study-plans" : "/survey", e)}
          >
            开始学习
          </Button>
        </div>
      </div>
    </main>
  );
}
