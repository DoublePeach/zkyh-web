'use client';

/**
 * @description 备考规划详情页面
 * @author 郝桃桃
 * @date 2023-10-01
 */

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Calendar, Clock, BookOpen, BarChart, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { getModuleTasks } from '@/lib/db-client';
import { toast } from 'sonner';
import useSWR from 'swr';
// Import types inferred from schema
import type { studyPlans, studyModules, dailyTasks } from '@/db/schema'; 
import type { InferSelectModel } from 'drizzle-orm'; 

// Define types based on schema
type StudyPlan = InferSelectModel<typeof studyPlans>;
type StudyModule = InferSelectModel<typeof studyModules>;
type DailyTask = InferSelectModel<typeof dailyTasks>;

// Define the expected structure of planDetails
interface PlanDetailsData {
    plan: StudyPlan;
    modules: StudyModule[];
    // tasks might need adjustment depending on what getModuleTasks returns
    // tasks: DailyTask[]; 
}

// Define a basic fetcher function for useSWR
const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function StudyPlanDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  
  // Fetch plan details using useSWR
  const { data: swrData, error, isLoading: swrLoading } = useSWR<{success: boolean, data?: PlanDetailsData, message?: string}>(
    id ? `/api/study-plans/${id}` : null, 
    fetcher
  );
  
  const [loading, setLoading] = useState(true); 
  // Use the specific type for planDetails state
  const [planDetails, setPlanDetails] = useState<PlanDetailsData | null>(null); 
  const [activeModuleId, setActiveModuleId] = useState<number | null>(null);
  // Use the specific type for tasks state
  const [tasks, setTasks] = useState<DailyTask[]>([]); 

  useEffect(() => {
    // Use data from SWR
    if (swrData) {
      if (swrData.success && swrData.data) { // Check if data exists
        setPlanDetails(swrData.data);
        if (swrData.data?.modules?.[0]) {
          setActiveModuleId(swrData.data.modules[0].id);
        }
      } else {
        toast.error("获取计划详情失败", { description: swrData.message });
      }
      setLoading(false); 
    } 
    if (error && !swrLoading) {
        toast.error("加载计划时出错", { description: error.message });
        setLoading(false);
    }
    if (swrLoading) {
        setLoading(true);
    }

  }, [swrData, error, swrLoading, router]);
  
  // 切换模块
  const handleModuleChange = async (moduleId: number) => {
    setActiveModuleId(moduleId);
    try {
       // Assume getModuleTasks returns DailyTask[]
      const moduleTasks: DailyTask[] = await getModuleTasks(moduleId);
      setTasks(moduleTasks);
    } catch (error) {
      console.error('获取模块任务失败:', error);
      toast.error('获取模块任务失败');
    }
  };
  
  // 计算完成进度
  const calculateProgress = () => {
    if (!tasks || tasks.length === 0) return 0;
    
    const completedTasks = tasks.filter(task => task.isCompleted).length;
    return Math.round((completedTasks / tasks.length) * 100);
  };
  
  // 格式化日期
  const formatDate = (dateInput: string | Date | null | undefined) => {
    if (!dateInput) return '-';
    try {
        const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
        return date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch {
        return String(dateInput); // Fallback to string conversion
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }
  
  if (!planDetails) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">备考规划未找到</p>
          <Link href="/">
            <Button>返回首页</Button>
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航栏 */}
      <div className="bg-white p-4 shadow-sm">
        <div className="container mx-auto flex items-center">
          <Link href="/" className="flex items-center text-gray-600 hover:text-gray-900">
            <ArrowLeft className="w-5 h-5 mr-2" />
            <span className="text-xl font-semibold">备考规划详情</span>
          </Link>
        </div>
      </div>
      
      <div className="container mx-auto px-4 py-6">
        {/* 规划头部信息 */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2">{planDetails.plan.title}</h1>
          <div className="flex flex-wrap gap-4 text-sm text-gray-500">
            <div className="flex items-center">
              <Calendar className="w-4 h-4 mr-1" />
              <span>开始日期: {formatDate(planDetails.plan.startDate)}</span>
            </div>
            <div className="flex items-center">
              <Calendar className="w-4 h-4 mr-1" />
              <span>考试日期: {formatDate(planDetails.plan.endDate)}</span>
            </div>
            <div className="flex items-center">
              <Clock className="w-4 h-4 mr-1" />
              <span>总天数: {planDetails.plan.totalDays}天</span>
            </div>
          </div>
        </div>
        
        {/* 总览卡片 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>备考总览</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 whitespace-pre-line">{planDetails.plan.overview}</p>
          </CardContent>
        </Card>
        
        {/* 学习进度 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>学习进度</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-2 flex justify-between items-center">
              <span className="text-sm text-gray-600">完成进度</span>
              <span className="text-sm font-medium">{calculateProgress()}%</span>
            </div>
            <Progress value={calculateProgress()} className="h-2" />
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <p className="text-3xl font-bold text-blue-600">{planDetails.modules.length}</p>
                <p className="text-sm text-gray-600">总模块数</p>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <p className="text-3xl font-bold text-green-600">{tasks.filter(t => t.isCompleted).length}</p>
                <p className="text-sm text-gray-600">已完成任务</p>
              </div>
              <div className="text-center p-3 bg-indigo-50 rounded-lg">
                <p className="text-3xl font-bold text-indigo-600">{tasks.length}</p>
                <p className="text-sm text-gray-600">总任务数</p>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <p className="text-3xl font-bold text-purple-600">{Math.round(tasks.reduce((acc, task) => acc + task.estimatedMinutes, 0) / 60)}</p>
                <p className="text-sm text-gray-600">总学习时长(小时)</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* 学习内容 */}
        <Tabs defaultValue="modules" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="modules">学习模块</TabsTrigger>
            <TabsTrigger value="tasks">每日任务</TabsTrigger>
          </TabsList>
          
          {/* 学习模块内容 */}
          <TabsContent value="modules" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {planDetails.modules.map((module: StudyModule) => (
                <Card key={module.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleModuleChange(module.id)}>
                  <CardContent className="p-4">
                    <div className={`w-full h-1 mb-3 ${activeModuleId === module.id ? 'bg-indigo-500' : 'bg-gray-200'}`}></div>
                    <h3 className="font-semibold text-lg mb-2">{module.title}</h3>
                    <p className="text-sm text-gray-600 mb-3">{module.description}</p>
                    <div className="flex justify-between text-sm">
                      <div className="flex items-center">
                        <BarChart className="w-4 h-4 mr-1 text-orange-500" />
                        <span>难度: {module.difficulty}/10</span>
                      </div>
                      <div className="flex items-center">
                        <BookOpen className="w-4 h-4 mr-1 text-blue-500" />
                        <span>{module.durationDays}天</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
          
          {/* 每日任务内容 */}
          <TabsContent value="tasks" className="mt-4">
            <div className="space-y-4">
              {tasks.map((task: DailyTask) => (
                <Card key={task.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start">
                      <div className={`mt-1 w-6 h-6 rounded-full flex items-center justify-center ${task.isCompleted ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                        <CheckCircle className="w-5 h-5" />
                      </div>
                      <div className="ml-3 flex-1">
                        <div className="flex justify-between items-center">
                          <h3 className="font-semibold">{task.title}</h3>
                          <span className="text-sm text-gray-500">预计{task.estimatedMinutes}分钟</span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                        
                        <div className="mt-3 p-3 bg-gray-50 rounded-md text-sm">
                          <p className="font-medium mb-1">学习内容:</p>
                          <div className="text-gray-700 whitespace-pre-line">
                            {task.learningContent}
                          </div>
                        </div>
                        
                        <div className="mt-3">
                          <Button 
                            variant={task.isCompleted ? "outline" : "default"}
                            size="sm"
                            className={task.isCompleted ? "text-green-600" : ""}
                            // 这里应该添加完成任务的处理逻辑
                          >
                            {task.isCompleted ? "已完成" : "标记为完成"}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {tasks.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-500">暂无任务</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
} 