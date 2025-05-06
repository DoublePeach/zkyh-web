'use client';

/**
 * @description 备考规划阶段详情视图组件 - 用于展示特定阶段的每日学习任务
 * @author 郝桃桃
 * @date 2024-06-20
 * @features
 * - 展示特定阶段的每日学习任务
 * - 支持标记任务完成功能
 * - 为任务添加"开始学习"按钮
 */

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Book, Clock, BookOpen, ArrowLeft, CheckCircle, PlayCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/use-auth-store';

// 定义类型
interface Plan {
  id: number;
  title: string;
  totalDays: number;
  startDate: string | Date;
  endDate: string | Date;
  overview?: string;
  planData?: Record<string, unknown>;
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

/**
 * @description 从localStorage获取缓存的规划数据
 * @param {string} planId - 备考规划ID
 * @returns {any|null} - 缓存的数据或null
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

export default function PhaseDetailView() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  
  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState<Plan>({} as Plan);
  const [phases, setPhases] = useState<Phase[]>([]);
  const [dailyPlans, setDailyPlans] = useState<DailyPlan[]>([]);
  const [currentPhase, setCurrentPhase] = useState<Phase | null>(null);
  
  // 获取特定阶段的任务
  const getPhaseTasks = (phaseId: number): DailyPlan[] => {
    if (!dailyPlans || !dailyPlans.length) return [];
    return dailyPlans.filter(plan => plan.phaseId === phaseId);
  };
  
  // 获取备考规划数据
  const fetchPlanData = async (planId: string, phaseId: string): Promise<void> => {
    setLoading(true);
    
    try {
      // 先尝试从缓存获取
      const cachedData = getCachedPlanData(planId);
      if (cachedData) {
        setPlan(cachedData.plan);
        setPhases(cachedData.phases);
        setDailyPlans(cachedData.dailyPlans);
        
        // 设置当前阶段
        const phaseIdNum = parseInt(phaseId, 10);
        const phase = cachedData.phases.find((p: Phase) => p.id === phaseIdNum);
        setCurrentPhase(phase || null);
        
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
      const plansWithStatus = result.data.dailyPlans.map((day: DailyPlan) => ({
        ...day,
        tasks: day.tasks.map((task) => ({
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
      
      // 设置当前阶段
      const phaseIdNum = parseInt(phaseId, 10);
      const phase = data.phases.find((p: Phase) => p.id === phaseIdNum);
      setCurrentPhase(phase || null);
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
    
    if (params?.id && params?.phaseId) {
      const planId = String(params.id);
      const phaseId = String(params.phaseId);
      fetchPlanData(planId, phaseId);
    }
  }, [params?.id, params?.phaseId, isAuthenticated, router]);
  
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
  
  // 开始学习任务
  const startLearningTask = (task: Task): void => {
    // 检查任务是否有学习资源
    if (task.resources && task.resources.length > 0) {
      // 可以根据资源类型进行不同处理
      // 这里简单显示第一个资源
      toast.info(`学习资源: ${task.resources[0]}`);
    } else {
      toast.success(`开始学习: ${task.title}`);
    }
    
    // 此处可以添加学习记录等逻辑
  };
  
  // 返回备考规划主页
  const goBackToStudyPlan = () => {
    router.push(`/study-plan/${params?.id}`);
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
  
  if (!currentPhase) {
    return (
      <div className="container flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-2xl font-bold mb-4">学习阶段不存在</h1>
        <p className="text-gray-500 mb-6">找不到您请求的学习阶段，它可能已被删除或您没有访问权限。</p>
        <Button onClick={goBackToStudyPlan}>返回备考规划</Button>
      </div>
    );
  }
  
  // 获取当前阶段的任务
  const phaseTasks = getPhaseTasks(currentPhase.id);
  
  // 计算阶段进度
  const getPhaseProgress = () => {
    if (!phaseTasks || !phaseTasks.length) return 0;
    
    let totalTasks = 0;
    let completedTasks = 0;
    
    phaseTasks.forEach(day => {
      if (day.tasks && day.tasks.length) {
        totalTasks += day.tasks.length;
        completedTasks += day.tasks.filter((t: any) => t.isCompleted).length;
      }
    });
    
    return totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  };
  
  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      {/* 页面标题 */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-10 w-10" 
            onClick={goBackToStudyPlan}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{currentPhase.name}</h1>
            <p className="text-gray-500 mt-1">第{currentPhase.startDay}-{currentPhase.endDay}天</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right mr-2">
            <p className="text-sm text-gray-500">完成进度</p>
            <p className="font-medium">{getPhaseProgress()}%</p>
          </div>
          <div className="w-24">
            <Progress value={getPhaseProgress()} className="h-2.5" />
          </div>
        </div>
      </div>
      
      {/* 阶段描述 */}
      <Card className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-none shadow-sm">
        <CardContent className="pt-6 pb-6">
          <p className="text-gray-700">{currentPhase.description}</p>
        </CardContent>
      </Card>
      
      {/* 每日任务列表 */}
      <h2 className="text-xl font-bold mb-4 text-gray-900">每日学习任务</h2>
      
      <div className="space-y-6">
        {phaseTasks.length > 0 ? (
          phaseTasks.map((dayPlan: DailyPlan) => (
            <Card key={dayPlan.day} className="overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="bg-gray-50 py-4 px-6">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg font-medium">第 {dayPlan.day} 天 - {dayPlan.title}</CardTitle>
                  <span className="text-sm text-gray-500">{dayPlan.date}</span>
                </div>
              </CardHeader>
              <CardContent className="py-5">
                <div className="flex flex-wrap gap-2 mb-4">
                  {dayPlan.subjects.map((subject: string, i: number) => (
                    <Badge key={i} variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/15">
                      {subject}
                    </Badge>
                  ))}
                </div>
                
                <div className="space-y-5 mt-4">
                  {dayPlan.tasks.map((task: Task, taskIndex: number) => (
                    <div 
                      key={taskIndex} 
                      className={`flex flex-col md:flex-row md:items-start gap-4 p-4 rounded-lg border ${
                        task.isCompleted ? 'bg-green-50 border-green-200' : 'border-gray-200'
                      }`}
                    >
                      <div className="flex-1">
                        <div className="flex items-start gap-2 mb-1">
                          {task.isCompleted ? (
                            <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                          ) : (
                            <div className="h-5 w-5 rounded-full border-2 border-gray-300 mt-0.5 flex-shrink-0" />
                          )}
                          <h4 className={`font-medium text-base ${task.isCompleted ? 'text-green-700' : 'text-gray-900'}`}>
                            {task.title}
                          </h4>
                        </div>
                        
                        <div className="ml-7">
                          <p className="text-sm text-gray-700 mb-3">{task.description}</p>
                          
                          <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 mb-3">
                            <span className="flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5" />
                              预计用时: {task.duration} 分钟
                            </span>
                            
                            {task.resources && task.resources.length > 0 && (
                              <span className="flex items-center gap-1.5">
                                <Book className="w-3.5 h-3.5" />
                                学习资源: {task.resources.length} 个
                              </span>
                            )}
                          </div>
                          
                          {task.resources && task.resources.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-dashed border-gray-200">
                              <p className="text-xs font-medium text-gray-700 mb-2">学习资源:</p>
                              <ul className="text-sm space-y-1.5">
                                {task.resources.map((resource: string, i: number) => (
                                  <li key={i} className="flex items-start">
                                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary mt-1.5 mr-2"></span>
                                    {resource}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex md:flex-col gap-2 mt-2 md:mt-0 ml-7 md:ml-0">
                        <Button 
                          variant="default" 
                          className="flex items-center gap-1.5"
                          onClick={() => startLearningTask(task)}
                        >
                          <PlayCircle className="h-4 w-4" />
                          开始学习
                        </Button>
                        
                        <Button 
                          variant={task.isCompleted ? "outline" : "secondary"} 
                          className={task.isCompleted ? "" : ""}
                          onClick={() => handleTaskComplete(dayPlan.day, taskIndex, currentPhase.id)}
                        >
                          {task.isCompleted ? "取消完成" : "标记完成"}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                
                {dayPlan.reviewTips && (
                  <div className="mt-5 pt-4 border-t border-gray-200">
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                      <BookOpen className="h-4 w-4 text-primary" />
                      <span>复习建议</span>
                    </div>
                    <p className="text-sm text-gray-600 pl-6">{dayPlan.reviewTips}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-gray-500">此阶段暂无学习任务</p>
              <Button variant="outline" className="mt-4" onClick={goBackToStudyPlan}>
                返回备考规划
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
} 