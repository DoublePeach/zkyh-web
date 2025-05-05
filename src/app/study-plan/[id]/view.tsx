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

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Calendar, Book, Clock, BarChart, CalendarDays, Timer, BookOpen, Star, ArrowRight, Trash, ArrowLeft } from 'lucide-react';
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

/**
 * @description 从localStorage获取缓存的规划数据
 * @param {string} planId - 备考规划ID
 * @returns {any|null} - 缓存的数据或null（如果没有缓存或已过期）
 */
function getCachedPlanData(planId: string) {
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
 * @param {any} data - 要缓存的数据
 * @returns {void}
 */
function cachePlanData(planId: string, data: any) {
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

export default function StudyPlanView() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  
  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState<any>({});
  const [phases, setPhases] = useState<any[]>([]);
  const [dailyPlans, setDailyPlans] = useState<any[]>([]);
  const [deleting, setDeleting] = useState(false);
  
  // 计算阶段进度
  const getPhaseProgress = (phaseId: number) => {
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
        completedTasks += day.tasks.filter((t: any) => t.isCompleted).length;
      }
    });
    
    return totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  };
  
  // 获取备考规划数据
  const fetchPlanData = async (planId: string) => {
    setLoading(true);
    
    try {
      // 先尝试从缓存获取
      const cachedData = getCachedPlanData(planId);
      if (cachedData) {
        setPlan(cachedData.plan);
        setPhases(cachedData.phases);
        setDailyPlans(cachedData.dailyPlans);
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
      
      // 为每个任务添加完成状态
      const plansWithStatus = result.data.dailyPlans.map((day: any) => ({
        ...day,
        tasks: day.tasks.map((task: any) => ({
          ...task,
          isCompleted: false
        }))
      }));
      
      // 处理数据
      const data = {
        ...result.data,
        dailyPlans: plansWithStatus
      };
      
      // 缓存数据
      cachePlanData(planId, data);
      
      setPlan(data.plan);
      setPhases(data.phases);
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
    
    if (params?.id) {
      const planId = String(params.id);
      fetchPlanData(planId);
    }
  }, [params?.id, isAuthenticated, router]);
  
  // 处理任务完成状态切换
  const handleTaskComplete = (dayIndex: number, taskIndex: number, phaseId: number) => {
    // 更新本地状态
    const updatedPlans = [...dailyPlans];
    const phaseTasksIndex = dailyPlans.findIndex(day => day.day === dayIndex && day.phaseId === phaseId);
    
    if (phaseTasksIndex !== -1 && updatedPlans[phaseTasksIndex].tasks[taskIndex]) {
      // 切换完成状态
      updatedPlans[phaseTasksIndex].tasks[taskIndex].isCompleted = !updatedPlans[phaseTasksIndex].tasks[taskIndex].isCompleted;
      setDailyPlans(updatedPlans);
      
      // 更新缓存
      if (params?.id) {
        cachePlanData(String(params.id), { plan, phases, dailyPlans: updatedPlans });
      }
      
      // 显示提示
      toast.success(
        updatedPlans[phaseTasksIndex].tasks[taskIndex].isCompleted 
          ? '任务已完成' 
          : '已取消完成状态'
      );
    }
  };

  // 跳转到阶段详情页面
  const goToPhaseDetail = (phaseId: number) => {
    router.push(`/study-plan/${params?.id}/phase/${phaseId}`);
  };
  
  // 处理删除规划
  const handleDeletePlan = async () => {
    if (!params?.id) return;
    
    try {
      setDeleting(true);
      // 确保params.id是字符串
      const planId = typeof params.id === 'string' ? params.id : params.id[0];
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
  
  if (!plan) {
    return (
      <div className="container flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-2xl font-bold mb-4">备考规划不存在</h1>
        <p className="text-gray-500 mb-6">找不到您请求的备考规划，它可能已被删除或您没有访问权限。</p>
        <Button onClick={() => router.push('/')}>返回首页</Button>
      </div>
    );
  }
  
  // 计算总体学习进度
  const getTotalProgress = () => {
    if (!dailyPlans || !dailyPlans.length) return 0;
    
    let totalTasks = 0;
    let completedTasks = 0;
    
    dailyPlans.forEach(day => {
      if (day.tasks && day.tasks.length) {
        totalTasks += day.tasks.length;
        completedTasks += day.tasks.filter((t: any) => t.isCompleted).length;
      }
    });
    
    return totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  };
  
  return (
    <div className="container max-w-5xl mx-auto py-8 px-4">
      {/* 页面标题与操作 */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-10 w-10" 
            onClick={() => router.push('/study-plans')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{plan.title}</h1>
            <p className="text-gray-500 mt-2">距离考试还有 <span className="font-medium text-primary">{plan.totalDays}</span> 天</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm"
                className="text-red-500 hover:text-red-700 hover:bg-red-50 mr-2"
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
          
          <Button variant="outline" className="flex items-center gap-2" onClick={() => fetchPlanData(String(params.id))}>
            <Calendar className="w-4 h-4" />
            <span>刷新计划</span>
          </Button>
        </div>
      </div>
      
      {/* 学习进度概览卡片 */}
      <Card className="mb-8 border-none shadow-md bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardContent className="pt-6">
          <div className="grid gap-6 md:grid-cols-3">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 text-sm">
                <CalendarDays className="h-4 w-4 text-primary" />
                <span className="font-medium">总学习天数</span>
              </div>
              <p className="text-2xl font-bold">{plan.totalDays}天</p>
            </div>
            
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 text-sm">
                <BookOpen className="h-4 w-4 text-primary" />
                <span className="font-medium">学习进度</span>
              </div>
              <div className="space-y-2">
                <Progress value={getTotalProgress()} className="h-2" />
                <p className="text-sm text-gray-500">{getTotalProgress()}% 完成</p>
              </div>
            </div>
            
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 text-sm">
                <Star className="h-4 w-4 text-primary" />
                <span className="font-medium">学习时间</span>
              </div>
              <p className="text-sm">
                {new Date(plan.startDate).toLocaleDateString()} 至 {new Date(plan.endDate).toLocaleDateString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* 总体概述 */}
      <Card className="mb-8 border border-gray-100 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl">备考方案总览</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-700 whitespace-pre-wrap">{plan.planData?.overview || plan.overview || "暂无备考方案总览信息"}</p>
        </CardContent>
      </Card>
      
      {/* 三阶段学习计划 */}
      <h2 className="text-2xl font-bold mb-4 text-gray-900">学习阶段</h2>
      <div className="space-y-6 mb-8">
        {phases.map((phase) => (
          <Card key={phase.id} className={`border-l-4 hover:shadow-md transition-shadow ${
            phase.id === 1 ? 'border-l-blue-500' : 
            phase.id === 2 ? 'border-l-green-500' : 
            'border-l-purple-500'
          }`}>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg">{phase.name}</CardTitle>
                <div className="text-sm text-gray-500">第{phase.startDay}-{phase.endDay}天</div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <p className="text-gray-700 text-sm mb-2">{phase.description}</p>
                <div className="flex justify-between items-center text-sm">
                  <span>完成进度</span>
                  <span>{getPhaseProgress(phase.id)}%</span>
                </div>
                <Progress value={getPhaseProgress(phase.id)} className="h-2 mt-1" />
              </div>
              
              <div className="grid md:grid-cols-3 gap-4 my-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-2">学习重点</h4>
                  <ul className="text-sm space-y-1">
                    {phase.focusAreas.map((area: string, i: number) => (
                      <li key={i} className="flex items-start">
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary mt-1.5 mr-2"></span>
                        {area}
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-2">学习目标</h4>
                  <ul className="text-sm space-y-1">
                    {phase.learningGoals.map((goal: string, i: number) => (
                      <li key={i} className="flex items-start">
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary mt-1.5 mr-2"></span>
                        {goal}
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-2">推荐资源</h4>
                  <ul className="text-sm space-y-1">
                    {phase.recommendedResources.map((resource: string, i: number) => (
                      <li key={i} className="flex items-start">
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary mt-1.5 mr-2"></span>
                        {resource}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              
              <Button 
                size="sm" 
                className="mt-2 flex items-center gap-1.5"
                onClick={() => goToPhaseDetail(phase.id)}
              >
                查看详细任务
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
} 