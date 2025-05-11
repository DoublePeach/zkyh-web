'use client';

/**
 * @description 备考规划生成进度页面
 * @author 郝桃桃
 * @date 2024-05-09
 */
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { usePlanGenerationStore } from '@/store/use-plan-generation-store';
import { ArrowLeft, BookOpen, Brain, Calendar, CheckCircle, Clock, RefreshCcw } from 'lucide-react';
import { createTaskPoller } from './poller';

/**
 * @component GeneratingPage
 * @description 显示备考规划生成进度的页面。它从localStorage获取任务ID，
 *              轮询后端以更新生成状态和进度，并向用户展示动态的反馈信息。
 *              处理成功、失败和进行中的各种状态。
 * @returns {JSX.Element}
 */
export default function GeneratingPage() {
  const router = useRouter();
  const { 
    status, 
    progress, 
    planId,
    error
  } = usePlanGenerationStore();
  
  // 用于显示的进度消息
  const [progressMessage, setProgressMessage] = useState<string>('准备数据...');
  
  // 保存任务ID
  const [taskId, setTaskId] = useState<string | null>(null);
  const [taskIdError, setTaskIdError] = useState<boolean>(false);
  
  // 添加的动态效果状态
  const [activeCard, setActiveCard] = useState<number>(0);
  const [showTip, setShowTip] = useState<boolean>(true);

  // 如果不是在生成状态，跳转到适当的页面
  useEffect(() => {
    if (status === 'idle') {
      localStorage.removeItem('current_task_id');
      router.push('/survey');
    } else if (status === 'success' && planId) {
      localStorage.removeItem('current_task_id');
      router.push(`/study-plan/${planId}`);
    } else if (status === 'error') {
      localStorage.removeItem('current_task_id');
      // No automatic redirect for error, user can retry or navigate away via UI
    }
  }, [status, planId, router]);
  
  // 获取任务ID
  useEffect(() => {
    const id = localStorage.getItem('current_task_id');
    setTaskId(id);
    
    if (!id && status === 'generating') {
      setTaskIdError(true);
      console.error('找不到任务ID，无法获取生成状态');
      
      // 更新状态为错误
      usePlanGenerationStore.getState().failPlanGeneration('找不到任务ID，无法继续生成');
    } else {
      setTaskIdError(false);
    }
  }, [status]);
  
  // 实际API轮询获取进度和生成状态
  useEffect(() => {
    if (status !== 'generating' || !taskId) return;
    
    // 创建轮询器
    const poller = createTaskPoller(taskId);
    poller.start();
    
    return () => {
      poller.stop();
    };
  }, [status, taskId]);
  
  // 根据进度更新消息
  useEffect(() => {
    if (progress < 20) {
      setProgressMessage('正在分析您的学习情况...');
    } else if (progress < 40) {
      setProgressMessage('正在设计学习阶段...');
    } else if (progress < 60) {
      setProgressMessage('正在规划每日学习任务...');
    } else if (progress < 80) {
      setProgressMessage('正在优化学习时间分配...');
    } else {
      setProgressMessage('即将完成，最后处理中...');
    }
  }, [progress]);
  
  // 动态效果：循环高亮卡片
  useEffect(() => {
    if (status !== 'generating') return;
    
    const interval = setInterval(() => {
      setActiveCard(prev => (prev + 1) % 4);
    }, 3000);
    
    return () => clearInterval(interval);
  }, [status]);
  
  // 动态效果：轮换提示信息
  useEffect(() => {
    if (status !== 'generating') return;
    
    const interval = setInterval(() => {
      setShowTip(prev => !prev);
    }, 5000);
    
    return () => clearInterval(interval);
  }, [status]);
  
  /**
   * @description 处理生成失败后的重试操作，或在其他情况下刷新页面。
   *              如果当前状态是错误状态，则导航到调研页面重新开始；否则，刷新当前页面。
   * @returns {void}
   */
  const handleRetry = () => {
    if (status === 'error') {
      router.push('/survey');
    } else {
      // 刷新页面
      window.location.reload();
    }
  };
  
  // 错误状态显示
  if (status === 'error') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-full max-w-lg p-6 bg-white rounded-lg shadow-md">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
              <span className="text-red-600 text-2xl">!</span>
            </div>
            <h2 className="text-xl font-semibold mb-2">生成备考规划时出错</h2>
            <p className="text-gray-600">{error || '发生了未知错误，请稍后重试'}</p>
            {taskIdError && (
              <p className="text-gray-500 mt-2 text-sm">
                无法找到任务ID，请重新开始生成流程
              </p>
            )}
          </div>
          
          <div className="flex justify-center space-x-4">
            <Button variant="outline" asChild>
              <Link href="/">返回首页</Link>
            </Button>
            <Button onClick={handleRetry}>
              {status === 'error' ? '重新开始' : '刷新页面'}
            </Button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航栏 */}
      <div className="bg-white p-4 shadow-sm">
        <div className="container mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center text-gray-600 hover:text-gray-900">
            <ArrowLeft className="w-5 h-5 mr-2" />
            <span className="text-xl font-semibold">返回首页</span>
          </Link>
          
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => window.location.reload()}
            className="text-gray-600 hover:text-gray-900"
          >
            <RefreshCcw className="w-4 h-4 mr-2" />
            <span>刷新</span>
          </Button>
        </div>
      </div>
      
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-center mb-8">
              <div className="w-16 h-16 mx-auto mb-4 relative">
                <div className="absolute inset-0 bg-indigo-100 rounded-full animate-ping opacity-60"></div>
                <div className="relative flex items-center justify-center w-full h-full bg-indigo-100 rounded-full">
                  <Brain className="h-8 w-8 text-indigo-600 animate-pulse" />
                </div>
              </div>
              <h1 className="text-2xl font-bold mb-2">正在生成您的专属备考规划</h1>
              <p className="text-gray-600">
                我们正在为您定制专属备考规划，请稍候～
              </p>
              {taskId && (
                <p className="text-xs text-gray-400 mt-1">
                  任务ID: {taskId}
                </p>
              )}
            </div>
            
            <div className="mb-6">
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">{progressMessage}</span>
                <span className="text-sm font-medium">{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-3 overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-400 to-indigo-600 opacity-75 blur-sm" style={{ width: `${progress}%`, animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}></div>
              </Progress>
            </div>
            
            <div className="flex items-center justify-center mb-8">
              <div className="flex items-center bg-blue-50 px-4 py-2 rounded-full">
                <Clock className="w-4 h-4 text-blue-600 mr-2" />
                <span className="text-sm text-blue-700">
                  预计用时：大约3-4分钟
                </span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className={`${activeCard === 0 ? 'bg-indigo-50 border-indigo-200 scale-105' : 'bg-gray-50'} p-4 rounded-lg border transition-all duration-500 ease-in-out`}>
                <div className="flex items-start">
                  <BookOpen className={`w-5 h-5 ${activeCard === 0 ? 'text-indigo-600' : 'text-gray-500'} mt-1 mr-3 transition-colors duration-500`} />
                  <div>
                    <h3 className="text-sm font-medium mb-1">学习计划制定中</h3>
                    <p className="text-xs text-gray-600">
                      我们将正在根据您的学习时间和基础，制定最适合您的学习路径
                    </p>
                  </div>
                </div>
              </div>
              
              <div className={`${activeCard === 1 ? 'bg-indigo-50 border-indigo-200 scale-105' : 'bg-gray-50'} p-4 rounded-lg border transition-all duration-500 ease-in-out`}>
                <div className="flex items-start">
                  <Calendar className={`w-5 h-5 ${activeCard === 1 ? 'text-indigo-600' : 'text-gray-500'} mt-1 mr-3 transition-colors duration-500`} />
                  <div>
                    <h3 className="text-sm font-medium mb-1">日程安排优化中</h3>
                    <p className="text-xs text-gray-600">
                      根据您的工作日和周末可用时间，平衡每日学习任务量
                    </p>
                  </div>
                </div>
              </div>
              
              <div className={`${activeCard === 2 ? 'bg-indigo-50 border-indigo-200 scale-105' : 'bg-gray-50'} p-4 rounded-lg border transition-all duration-500 ease-in-out`}>
                <div className="flex items-start">
                  <Brain className={`w-5 h-5 ${activeCard === 2 ? 'text-indigo-600' : 'text-gray-500'} mt-1 mr-3 transition-colors duration-500`} />
                  <div>
                    <h3 className="text-sm font-medium mb-1">知识点分析中</h3>
                    <p className="text-xs text-gray-600">
                      正在筛选出最重要的知识点，并安排合理的学习顺序
                    </p>
                  </div>
                </div>
              </div>
              
              <div className={`${activeCard === 3 ? 'bg-indigo-50 border-indigo-200 scale-105' : 'bg-gray-50'} p-4 rounded-lg border transition-all duration-500 ease-in-out`}>
                <div className="flex items-start">
                  <CheckCircle className={`w-5 h-5 ${activeCard === 3 ? 'text-indigo-600' : 'text-gray-500'} mt-1 mr-3 transition-colors duration-500`} />
                  <div>
                    <h3 className="text-sm font-medium mb-1">资源整合中</h3>
                    <p className="text-xs text-gray-600">
                      正在为每个学习任务匹配最合适的学习资源
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="relative h-16">
              <div className={`absolute w-full text-center text-sm text-gray-500 transition-opacity duration-500 ${showTip ? 'opacity-100' : 'opacity-0'}`}>
                <p>备考规划生成需要3-4分钟，您可以前往首页浏览其他内容</p>
                <p className="mt-1">规划生成完成后将会自动跳转到您的专属备考规划详情页</p>
              </div>
              <div className={`absolute w-full text-center text-sm text-gray-500 transition-opacity duration-500 ${showTip ? 'opacity-0' : 'opacity-100'}`}>
                <p>我们正在努力为您生成最合适的备考规划</p>
                <p className="mt-1">耐心等待一下，很快就能完成～</p>
              </div>
            </div>
            
            {/* 底部装饰元素 */}
            <div className="mt-6 flex justify-center space-x-2">
              <div className="w-2 h-2 bg-indigo-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '600ms' }}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 