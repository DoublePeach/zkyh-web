'use client';

/**
 * @description 学习页面
 * @author 郝桃桃
 * @date 2023-10-01
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, BookOpen, Calendar, Clock, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/use-auth-store';
import { getUserStudyPlans } from '@/lib/db-client';
// Import type inferred from schema
import type { studyPlans } from '@/db/schema'; 
import type { InferSelectModel } from 'drizzle-orm'; 

type StudyPlan = InferSelectModel<typeof studyPlans>;

export default function LearnPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [studyPlans, setStudyPlans] = useState<StudyPlan[]>([]);
  
  // 加载用户的备考规划
  useEffect(() => {
    const fetchData = async () => {
      if (!isAuthenticated || !user) {
        toast.error('请先登录后查看学习内容');
        router.push('/login');
        return;
      }
      
      try {
        setLoading(true);
        const plans = await getUserStudyPlans(user.id);
        setStudyPlans(plans);
      } catch (error) {
        console.error('获取备考规划失败:', error);
        toast.error('获取备考规划失败');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [isAuthenticated, user, router]);
  
  // 格式化日期 (Handles Date or string)
  const formatDate = (dateInput: string | Date | null | undefined) => {
    if (!dateInput) return '-';
    try {
        const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
        return date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch {
        return String(dateInput); // Fallback
    }
  };
  
  // 计算距离考试天数 (Handles Date or string)
  const calculateDaysUntilExam = (examDateInput: string | Date | null | undefined) => {
    if (!examDateInput) return '-'; // Return dash if no date
    try {
        const now = new Date();
        const exam = typeof examDateInput === 'string' ? new Date(examDateInput) : examDateInput;
        // Set time to 0 to compare dates only
        now.setHours(0, 0, 0, 0);
        exam.setHours(0, 0, 0, 0);
        const diffTime = exam.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays >= 0 ? diffDays : 0; // Return 0 if date passed
    } catch {
        return 'N/A'; // Return N/A if parsing fails
    }
  };
  
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
      
      <div className="container mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-6">我的备考规划</h1>
        
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">加载中...</p>
          </div>
        ) : studyPlans.length > 0 ? (
          <div className="grid grid-cols-1 gap-6">
            {studyPlans.map(plan => (
              <Card key={plan.id} className="overflow-hidden">
                <div className="h-2 bg-indigo-500"></div>
                <CardHeader>
                  <CardTitle>{plan.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <p className="text-gray-700 line-clamp-3">{plan.overview}</p>
                  </div>
                  
                  <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-4">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      <span>开始: {formatDate(plan.startDate)}</span>
                    </div>
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      <span>考试: {formatDate(plan.endDate)}</span>
                    </div>
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      <span>
                        剩余 {calculateDaysUntilExam(plan.endDate)} 天
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <BookOpen className="w-5 h-5 mr-2 text-indigo-500" />
                      <span>总天数: {plan.totalDays}天</span>
                    </div>
                    <Link href={`/study-plan/${plan.id}`}>
                      <Button className="gap-2">
                        查看详情
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <BookOpen className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h2 className="text-xl font-semibold mb-2">暂无备考规划</h2>
            <p className="text-gray-600 mb-6">您还没有创建任何备考规划，开始创建一个吧！</p>
            <Link href="/survey">
              <Button className="gap-2">
                创建备考规划
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
} 