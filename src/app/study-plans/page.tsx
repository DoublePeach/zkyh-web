'use client';

/**
 * @description 备考规划列表页面 - 学习中心入口
 * @author 郝桃桃
 * @date 2024-06-25
 */

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Card, 
  CardContent,
  CardFooter
} from '@/components/ui/card';
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
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/store/use-auth-store';
import { getUserStudyPlans, deleteStudyPlan } from '@/lib/db-client';
import { CalendarDays, ChevronRight, Calendar, Trash, Plus, BookOpen, PenToolIcon, ArrowLeft, Clock } from 'lucide-react';
import { toast } from 'sonner';
import type { studyPlans } from '@/db/schema';
import type { InferSelectModel } from 'drizzle-orm';

type StudyPlan = InferSelectModel<typeof studyPlans>;

export default function StudyPlansPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const [studyPlans, setStudyPlans] = useState<StudyPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingPlanId, setDeletingPlanId] = useState<number | null>(null);
  
  // 获取所有备考规划
  const fetchStudyPlans = useCallback(async () => {
    if (!isAuthenticated || !user) return;
    
    try {
      setLoading(true);
      const plans = await getUserStudyPlans(user.id);
      // 按创建时间降序排序
      const sortedPlans = plans.sort((a, b) => {
        const dateA = new Date(a.createdAt || a.startDate);
        const dateB = new Date(b.createdAt || b.startDate);
        return dateB.getTime() - dateA.getTime();
      });
      setStudyPlans(sortedPlans);
    } catch (error) {
      console.error('获取备考规划失败:', error);
      toast.error('获取备考规划失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user]);
  
  // 删除备考规划
  const handleDeletePlan = async (planId: number) => {
    try {
      setDeletingPlanId(planId);
      const success = await deleteStudyPlan(planId);
      
      if (success) {
        toast.success('备考规划已删除');
        // 重新获取列表
        fetchStudyPlans();
      } else {
        toast.error('删除备考规划失败');
      }
    } catch (error) {
      console.error('删除备考规划失败:', error);
      toast.error('删除备考规划失败，请稍后重试');
    } finally {
      setDeletingPlanId(null);
    }
  };
  
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    
    fetchStudyPlans();
  }, [isAuthenticated, router, user, fetchStudyPlans]);
  
  // 计算距离考试的天数
  const getDaysRemaining = (endDate: Date) => {
    const now = new Date();
    const end = new Date(endDate);
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };
  
  // 获取考试年份显示文本
  const getExamYearDisplay = (studyPlan: StudyPlan) => {
    return studyPlan.examYear ? `${studyPlan.examYear}年考试` : '';
  };
  
  // 获取规划的第一个阶段ID，用于"开始学习"按钮
  const getFirstPhaseId = (_studyPlan: StudyPlan) => {
    // 这里假设计划的第一个阶段ID是1，如果有更准确的方式获取可以修改
    return 1;
  };

  // 格式化创建时间
  const formatCreationDate = (date: Date | string) => {
    const createDate = new Date(date);
    return `${createDate.getFullYear()}年${createDate.getMonth() + 1}月${createDate.getDate()}日`;
  };

  // 分离当前规划和历史规划
  const currentPlan = studyPlans.length > 0 ? studyPlans[0] : null;
  const historyPlans = studyPlans.slice(1);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航栏 */}
      <div className="bg-white p-4 shadow-sm">
        <div className="container mx-auto flex items-center">
          <Link href="/" className="flex items-center text-gray-600 hover:text-gray-900">
            <ArrowLeft className="w-5 h-5 mr-2" />
            <span className="text-xl font-semibold">学习中心</span>
          </Link>
        </div>
      </div>
      
      <div className="container max-w-4xl mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">我的备考规划</h1>
          <Link href="/survey">
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              创建新规划
            </Button>
          </Link>
        </div>
        
        {loading ? (
          // 加载状态
          <div className="flex justify-center items-center py-20">
            <div className="flex flex-col items-center gap-3">
              <div className="h-10 w-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              <p className="text-gray-500">正在加载备考规划...</p>
            </div>
          </div>
        ) : studyPlans.length > 0 ? (
          <div className="space-y-10">
            {/* 当前备考规划 */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">当前备考规划</h2>
              <Card 
                key={currentPlan?.id}
                className="overflow-hidden bg-white hover:shadow-md transition-shadow border border-gray-100"
              >
                <CardContent className="p-0">
                  <div className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h2 className="text-xl font-bold text-gray-900">{currentPlan?.title}</h2>
                          <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-200">
                            进行中
                          </Badge>
                        </div>
                        
                        <div className="text-sm text-gray-500">
                          <span className="inline-flex items-center mr-4">
                            <CalendarDays className="h-4 w-4 mr-1" />
                            {new Date(currentPlan?.startDate || '').toLocaleDateString()} 至 {new Date(currentPlan?.endDate || '').toLocaleDateString()}
                          </span>
                          {currentPlan?.examYear && (
                            <span className="inline-flex items-center">
                              <Calendar className="h-4 w-4 mr-1" />
                              {getExamYearDisplay(currentPlan)}
                            </span>
                          )}
                        </div>
                        
                        <div className="text-xs text-gray-500 mt-2 flex items-center">
                          <Clock className="h-3.5 w-3.5 mr-1" />
                          您在 {formatCreationDate(currentPlan?.createdAt || currentPlan?.startDate || new Date())} 创建了此备考规划
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <div className="px-4 py-2 bg-blue-50 rounded-md">
                          <p className="text-sm text-gray-500">总天数</p>
                          <p className="font-semibold text-lg">{currentPlan?.totalDays}天</p>
                        </div>
                        <div className="px-4 py-2 bg-purple-50 rounded-md">
                          <p className="text-sm text-gray-500">剩余天数</p>
                          <p className="font-semibold text-lg">{getDaysRemaining(currentPlan?.endDate || new Date())}天</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
                
                <CardFooter className="bg-gray-50 p-4 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          disabled={deletingPlanId === currentPlan?.id}
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
                            onClick={() => currentPlan && handleDeletePlan(currentPlan.id)}
                          >
                            确定删除
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Link href={`/study-plan/${currentPlan?.id}`}>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex items-center gap-1"
                      >
                        <BookOpen className="h-4 w-4" />
                        查看计划
                      </Button>
                    </Link>
                    
                    <Link href={`/study-plan/${currentPlan?.id}/phase/${currentPlan ? getFirstPhaseId(currentPlan) : 1}`}>
                      <Button
                        size="sm"
                        className="flex items-center gap-1"
                      >
                        <PenToolIcon className="h-4 w-4" />
                        开始学习
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </CardFooter>
              </Card>
            </div>
            
            {/* 历史规划记录 */}
            {historyPlans.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">历史规划记录</h2>
                <div className="grid gap-6">
                  {historyPlans.map((plan) => (
                    <Card 
                      key={plan.id}
                      className="overflow-hidden bg-white hover:shadow-md transition-shadow border border-gray-100"
                    >
                      <CardContent className="p-0">
                        <div className="p-6">
                          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <h2 className="text-xl font-bold text-gray-900">{plan.title}</h2>
                                <Badge variant="outline" className="bg-gray-100 text-gray-600 hover:bg-gray-200">
                                  已归档
                                </Badge>
                              </div>
                              
                              <div className="text-sm text-gray-500">
                                <span className="inline-flex items-center mr-4">
                                  <CalendarDays className="h-4 w-4 mr-1" />
                                  {new Date(plan.startDate).toLocaleDateString()} 至 {new Date(plan.endDate).toLocaleDateString()}
                                </span>
                                {plan.examYear && (
                                  <span className="inline-flex items-center">
                                    <Calendar className="h-4 w-4 mr-1" />
                                    {getExamYearDisplay(plan)}
                                  </span>
                                )}
                              </div>
                              
                              <div className="text-xs text-gray-500 mt-2 flex items-center">
                                <Clock className="h-3.5 w-3.5 mr-1" />
                                您在 {formatCreationDate(plan.createdAt || plan.startDate)} 创建了此备考规划
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-3">
                              <div className="px-4 py-2 bg-blue-50 rounded-md">
                                <p className="text-sm text-gray-500">总天数</p>
                                <p className="font-semibold text-lg">{plan.totalDays}天</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                      
                      <CardFooter className="bg-gray-50 p-4 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                disabled={deletingPlanId === plan.id}
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
                                  onClick={() => handleDeletePlan(plan.id)}
                                >
                                  确定删除
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <Link href={`/study-plan/${plan.id}`}>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="flex items-center gap-1"
                            >
                              <BookOpen className="h-4 w-4" />
                              查看计划
                            </Button>
                          </Link>
                        </div>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          // 空状态
          <Card className="bg-white border border-gray-100">
            <CardContent className="p-10 flex flex-col items-center justify-center">
              <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                <Calendar className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-medium text-gray-900 mb-2">还没有备考规划</h3>
              <p className="text-gray-500 mb-6 text-center max-w-md">
                创建个性化备考规划，制定学习目标和进度，系统化备考更高效
              </p>
              <Link href="/survey">
                <Button className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  创建备考规划
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
} 