'use client';

/**
 * @description 备考规划详情视图组件 - 用于显示生成的备考规划，包括三阶段学习计划和每日任务
 * @author 郝桃桃
 * @date 2024-06-15
 * @features
 * - 分三个学习阶段（基础学习、重点强化、模拟冲刺）展示备考计划
 * - 每个阶段显示学习重点、学习目标和推荐资源
 * - 展示每日学习任务，并支持标记完成功能
 * - 使用localStorage进行数据缓存，减少API请求
 */

import { useEffect, useState, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Calendar, BookOpen, Star, ArrowRight, Trash, ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/use-auth-store';
import { deleteStudyPlan } from '@/lib/db-client';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

// 定义类型
interface Plan {
  id: number;
  title: string;
  totalDays: number;
  startDate: string | Date;
  endDate: string | Date;
  overview?: string;
  planData?: {
    overview?: string;
  };
}

interface Phase {
  id: number;
  name: string;
  description: string;
  startDay: number;
  endDay: number;
  focusAreas: string[];
  learningGoals: string[];
  recommendedResources: string[];
}

interface Task {
  title: string;
  description: string;
  duration: number;
  resources: string[];
  isCompleted: boolean;
}

interface DailyPlan {
  day: number;
  date: string;
  phaseId: number;
  title: string;
  subjects: string[];
  tasks: Task[];
  reviewTips?: string;
}

// 带Suspense的路由参数组件
function RouteParamsProvider({ 
  children 
}: { 
  children: (params: { id?: string }) => React.ReactNode 
}) {
  const params = useParams();
  return <>{children({ id: params?.id as string })}</>;
}

// 带Suspense的路由器组件
function RouterProvider({
  children
}: {
  children: (router: ReturnType<typeof useRouter>) => React.ReactNode
}) {
  const router = useRouter();
  return <>{children(router)}</>;
}

/**
 * @description 从localStorage获取缓存的规划数据
 * @param {string} planId - 备考规划ID
 * @returns {Object|null} - 缓存的数据或null（如果没有缓存或已过期）
 */
function getCachedPlanData(planId: string): { plan: Plan; phases: Phase[]; dailyPlans: DailyPlan[] } | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const cacheKey = `plan_${planId}`;
    const cached = localStorage.getItem(cacheKey);
    
    if (!cached) return null;
    
    const { data, timestamp } = JSON.parse(cached);
    const now = new Date().getTime();
    
    // 检查缓存是否过期（24小时）
    if (now - timestamp > 24 * 60 * 60 * 1000) {
      localStorage.removeItem(cacheKey);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('读取缓存数据失败:', error);
    return null;
  }
}

/**
 * @description 缓存规划数据到localStorage
 * @param {string} planId - 备考规划ID 
 * @param {Object} data - 要缓存的数据
 * @returns {void}
 */
function cachePlanData(planId: string, data: { plan: Plan; phases: Phase[]; dailyPlans: DailyPlan[] }): void {
  if (typeof window === 'undefined') return;
  
  try {
    const cacheKey = `plan_${planId}`;
    const cacheData = {
      data,
      timestamp: new Date().getTime()
    };
    
    localStorage.setItem(cacheKey, JSON.stringify(cacheData));
  } catch (error) {
    console.error('缓存数据失败:', error);
  }
}

// 主视图组件
function StudyPlanViewContent({ planId, router }: { planId: string, router: ReturnType<typeof useRouter> }) {
  const { isAuthenticated } = useAuthStore();
  
  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState<Plan>({} as Plan);
  const [phases, setPhases] = useState<Phase[]>([]);
  const [dailyPlans, setDailyPlans] = useState<DailyPlan[]>([]);
  const [deleting, setDeleting] = useState(false);
  const [expandedSection, setExpandedSection] = useState<number | null>(1);
  
  // 计算阶段进度
  const getPhaseProgress = (phaseId: number): number => {
    if (!dailyPlans || !dailyPlans.length) return 0;
    
    // 统计已完成的任务数
    const phasePlans = dailyPlans.filter(plan => plan.phaseId === phaseId);
    if (!phasePlans.length) return 0;
    
    // 统计任务完成状态
    let totalTasks = 0;
    let completedTasks = 0;
    
    phasePlans.forEach(day => {
      if (day.tasks && day.tasks.length) {
        totalTasks += day.tasks.length;
        completedTasks += day.tasks.filter((t) => t.isCompleted).length;
      }
    });
    
    return totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  };
  
  // 获取备考规划数据
  const fetchPlanData = async (planId: string): Promise<void> => {
    setLoading(true);
    
    try {
      // 先尝试从缓存获取
      const cachedData = getCachedPlanData(planId);
      if (cachedData) {
        setPlan(cachedData.plan);
        setPhases(cachedData.phases || []);
        setDailyPlans(cachedData.dailyPlans || []);
        setLoading(false);
        return;
      }
      
      // 如果没有缓存，从API获取
      const response = await fetch(`/api/study-plans/${planId}`);
      
      if (!response.ok) {
        throw new Error(`获取备考规划失败: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || '获取备考规划失败');
      }
      
      // 添加默认空数组，防止undefined
      const phasesData = result.data.phases || [];
      const dailyPlansData = result.data.dailyPlans || [];
      
      // 为每个任务添加完成状态
      const plansWithStatus = dailyPlansData.map((day: DailyPlan) => ({
        ...day,
        tasks: (day.tasks || []).map((task) => ({
          ...task,
          isCompleted: false
        }))
      }));
      
      // 处理数据
      const data = {
        ...result.data,
        phases: phasesData,
        dailyPlans: plansWithStatus
      };
      
      // 缓存数据
      cachePlanData(planId, data);
      
      setPlan(data.plan);
      setPhases(phasesData);
      setDailyPlans(plansWithStatus);
    } catch (error) {
      console.error('获取备考规划失败:', error);
      toast.error('获取备考规划失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    
    if (planId) {
      fetchPlanData(planId);
    }
  }, [planId, isAuthenticated, router]);
  
  // 处理删除规划
  const handleDeletePlan = async (): Promise<void> => {
    if (!planId) return;
    
    try {
      setDeleting(true);
      const success = await deleteStudyPlan(planId);
      
      if (success) {
        toast.success('备考规划已删除');
        router.push('/study-plans');
      } else {
        toast.error('删除备考规划失败');
      }
    } catch (error) {
      console.error('删除备考规划失败:', error);
      toast.error('删除备考规划失败，请稍后重试');
    } finally {
      setDeleting(false);
    }
  };

  // 跳转到阶段详情页面
  const goToPhaseDetail = (phaseId: number): void => {
    router.push(`/study-plan/${planId}/phase/${phaseId}`);
  };
  
  // 切换展开/折叠状态
  const toggleSection = (sectionId: number) => {
    setExpandedSection(expandedSection === sectionId ? null : sectionId);
  };
  
  if (loading) {
    return (
      <div className="container flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 border-4 border-primary border-t-transparent animate-spin rounded-full"></div>
          <p className="text-lg">加载备考规划中...</p>
        </div>
      </div>
    );
  }
  
  if (!plan || !plan.id) {
    return (
      <div className="container flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-2xl font-bold mb-4">备考规划不存在</h1>
        <p className="text-gray-500 mb-6">找不到您请求的备考规划，它可能已被删除或您没有访问权限。</p>
        <Button onClick={() => router.push('/')}>返回首页</Button>
      </div>
    );
  }
  
  // 确保数组存在
  const safePhases = phases || [];
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航栏 */}
      <div className="bg-white p-4 shadow-sm">
        <div className="container mx-auto flex items-center">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-10 w-10" 
            onClick={() => router.push('/study-plans')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <span className="text-xl font-semibold">备考规划</span>
          <div className="ml-auto">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  disabled={deleting}
                >
                  <Trash className="h-4 w-4 mr-1" />
                  删除规划
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>确定要删除这个备考规划吗？</AlertDialogTitle>
                  <AlertDialogDescription>
                    此操作将永久删除这个备考规划及其所有数据，无法恢复。
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>取消</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-red-500 hover:bg-red-600"
                    onClick={handleDeletePlan}
                  >
                    确定删除
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>
      
      <div className="container mx-auto py-6 px-4 max-w-3xl">
        {/* 考情速递 */}
        <div className="mb-6">
          <div 
            className="flex justify-between items-center mb-2 px-4 py-2 bg-white rounded-lg shadow-sm cursor-pointer"
            onClick={() => toggleSection(1)}
          >
            <div className="flex items-center">
              <BookOpen className="h-5 w-5 mr-2 text-blue-600" />
              <h2 className="font-semibold text-lg">考情速递</h2>
            </div>
            {expandedSection === 1 ? (
              <ChevronUp className="h-5 w-5 text-gray-500" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-500" />
            )}
          </div>
          
          {expandedSection === 1 && (
            <div className="p-4 bg-white rounded-lg shadow-sm">
              {/* 根据计划标题判断是何种职称考试 */}
              {plan.title && plan.title.includes('初级护师') ? (
                <>
                  <p className="mb-2">初级护师的考试有四个项目: 基础知识、相关专业知识、专业知识以及专业实践能力。</p>
                  <p>包含6个学科: 基础护理学、内科护理学、外科护理学、妇科护理学、儿科护理学、中医护理学。</p>
                </>
              ) : plan.title && plan.title.includes('主管护师') ? (
                <>
                  <p className="mb-2">主管护师的考试有四个项目: 基础知识、相关专业知识、专业知识以及专业实践能力。</p>
                  <p>包含6个学科: 基础护理学、内科护理学、外科护理学、妇科护理学、儿科护理学、中医护理学。题目难度和深度较初级护师有所提高。</p>
                </>
              ) : (
                <>
                  <p className="mb-2">护理职称考试通常有四个项目: 基础知识、相关专业知识、专业知识以及专业实践能力。</p>
                  <p>包含6个主要学科: 基础护理学、内科护理学、外科护理学、妇科护理学、儿科护理学、中医护理学。</p>
                </>
              )}
            </div>
          )}
        </div>
        
        {/* 规划总览 */}
        <div className="mb-6">
          <div 
            className="flex justify-between items-center mb-2 px-4 py-2 bg-white rounded-lg shadow-sm cursor-pointer"
            onClick={() => toggleSection(2)}
          >
            <div className="flex items-center">
              <Calendar className="h-5 w-5 mr-2 text-blue-600" />
              <h2 className="font-semibold text-lg">规划总览</h2>
            </div>
            {expandedSection === 2 ? (
              <ChevronUp className="h-5 w-5 text-gray-500" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-500" />
            )}
          </div>
          
          {expandedSection === 2 && (
            <div className="p-4 bg-white rounded-lg shadow-sm">
              {plan.overview || (plan.planData && plan.planData.overview) ? (
                <p className="mb-4 whitespace-pre-line">{plan.overview || (plan.planData && plan.planData.overview)}</p>
              ) : (
                <>
                  <p className="mb-4">您的目标是在2026年4月通过初级护师职称考试，根据您选择的&quot;通关模式&quot;生成以下具体备考规划，请查收～</p>
                  
                  <div className="bg-blue-50 p-4 rounded-lg mb-4">
                    <p className="mb-2 text-gray-700">学习将分为3个阶段(不同难度对应不同的阶段):</p>
                    <ul className="list-disc list-inside space-y-1 text-gray-700">
                      <li>基础阶段</li>
                      <li>强化阶段</li>
                      <li>冲刺阶段</li>
                    </ul>
                  </div>
                  
                  <p className="text-gray-700 italic">持之以恒才是考试通关的秘诀～ 偶尔懈怠了也不担心，我们会根据你的进度重新规划时间</p>
                </>
              )}
            </div>
          )}
        </div>
        
        {/* 阶段具体规划 */}
        <div className="mb-6">
          <h2 className="font-semibold text-lg flex items-center mb-4">
            <Star className="h-5 w-5 mr-2 text-blue-600" />
            阶段具体规划
          </h2>
          
          <div className="space-y-4">
            {safePhases.map((phase) => (
              <Card 
                key={phase.id} 
                className={`border-l-4 ${
                  phase.id === 1 ? 'border-l-blue-500' : 
                  phase.id === 2 ? 'border-l-green-500' : 
                  'border-l-purple-500'
                }`}
              >
                <div className="border-b px-4 py-3 flex items-center justify-between">
                  <CardTitle className="text-base font-medium">{phase.name}</CardTitle>
                  <div className="text-sm text-gray-500">第{phase.startDay}-{phase.endDay}天</div>
                </div>
                <CardContent className="pt-3">
                  <div 
                    className="cursor-pointer mb-2" 
                    onClick={() => toggleSection(phase.id + 10)}
                  >
                    <div className="flex justify-between items-center">
                      <p className="text-gray-700 text-sm">{phase.description}</p>
                      {expandedSection === phase.id + 10 ? (
                        <ChevronUp className="h-4 w-4 text-gray-500 flex-shrink-0 ml-2" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-gray-500 flex-shrink-0 ml-2" />
                      )}
                    </div>
                    <div className="mt-2">
                      <div className="flex justify-between items-center text-sm">
                        <span>完成进度</span>
                        <span>{getPhaseProgress(phase.id)}%</span>
                      </div>
                      <Progress value={getPhaseProgress(phase.id)} className="h-2 mt-1" />
                    </div>
                  </div>
                  
                  {expandedSection === phase.id + 10 && (
                    <div className="mt-4 border-t pt-3">
                      <div className="grid gap-4">
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-2">学习重点</h4>
                          <ul className="text-sm space-y-1">
                            {(phase.focusAreas || []).map((area: string, i: number) => (
                              <li key={i} className="flex items-start">
                                <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 mr-2"></span>
                                {area}
                              </li>
                            ))}
                          </ul>
                        </div>
                        
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-2">学习目标</h4>
                          <ul className="text-sm space-y-1">
                            {(phase.learningGoals || []).map((goal: string, i: number) => (
                              <li key={i} className="flex items-start">
                                <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 mr-2"></span>
                                {goal}
                              </li>
                            ))}
                          </ul>
                        </div>
                        
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-2">推荐资源</h4>
                          <ul className="text-sm space-y-1">
                            {(phase.recommendedResources || []).map((resource: string, i: number) => (
                              <li key={i} className="flex items-start">
                                <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 mr-2"></span>
                                {resource}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                      
                      <Button 
                        size="sm" 
                        className="mt-4 w-full"
                        onClick={() => goToPhaseDetail(phase.id)}
                      >
                        查看详细任务
                        <ArrowRight className="h-3.5 w-3.5 ml-1" />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// 导出带Suspense的主组件
export default function StudyPlanView() {
  return (
    <Suspense fallback={
      <div className="container flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 border-4 border-primary border-t-transparent animate-spin rounded-full"></div>
          <p className="text-lg">加载备考规划中...</p>
        </div>
      </div>
    }>
      <RouterProvider>
        {(router) => (
          <RouteParamsProvider>
            {(params) => (
              <StudyPlanViewContent 
                planId={params.id || ''} 
                router={router}
              />
            )}
          </RouteParamsProvider>
        )}
      </RouterProvider>
    </Suspense>
  );
} 