'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Calendar, Info } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { SurveyFormData } from '@/types/survey';
import { useAuthStore } from '@/store/use-auth-store';
import { createStudyPlan } from '@/lib/db-client';

export default function SurveyPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // 固定考试年份为2026年
  const examYear = '2026';
  
  // 表单数据 - 简化版，初级护师、四科目全选，固定为基础薄弱
  const [formData, setFormData] = useState<SurveyFormData>({
    // 考试基本信息 - 已固定为初级护师
    titleLevel: 'junior',
    otherTitleLevel: '', 
    examStatus: 'first', 
    examYear: examYear,
    
    // 考试科目选择 - 固定为全选
    subjects: {
      basic: true,     // 基础知识
      related: true,   // 相关专业知识
      professional: true, // 专业知识
      practical: true, // 专业实践能力
    },
    
    // 学习基础评估 - 默认为基础薄弱
    overallLevel: 'weak',
    subjectLevels: {
      basic: 'low',
      related: 'low',
      professional: 'low',
      practical: 'low',
    },
    
    // 学习时间安排
    weekdaysCount: '1-2', // 每周学习天数
    weekdayHours: '<1', // 工作日每天学习小时数
    weekendHours: '<2', // 周末每天学习小时数
  });
  
  // 更新基本表单数据
  const updateFormData = (key: keyof SurveyFormData, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };
  
  // 处理下一步
  const handleNext = () => {
    if (step < 2) {
      setStep(s => s + 1);
    } else {
      generatePlan();
    }
  };
  
  // 处理上一步
  const handlePrevious = () => {
    if (step > 1) {
      setStep(s => s - 1);
    }
  };
  
  // 生成备考规划
  const generatePlan = async () => {
    if (!isAuthenticated || !user) {
      toast.error('请先登录后再生成备考规划');
      router.push('/login');
      return;
    }
    
    setLoading(true);
    
    try {
      // 调用后端API创建备考规划
      const planId = await createStudyPlan(user.id, formData);
      
      // 跳转到生成的备考规划页面
      router.push(`/study-plan/${planId}`);
      toast.success('备考规划生成成功！');
    } catch (error) {
      console.error('生成备考规划失败:', error);
      
      // 为不同类型的错误提供更具体的反馈
      if (error instanceof Error && error.message.includes('Internal Server Error')) {
        toast.error('服务器连接超时，请稍后重试，系统将使用备用方案继续为您生成规划');
        
        // 再次尝试创建规划，通常会使用备用方案
        try {
          setTimeout(async () => {
            const planId = await createStudyPlan(user.id, formData);
            router.push(`/study-plan/${planId}`);
            toast.success('已使用备用方案生成备考规划');
          }, 2000);
          return;
        } catch (retryError) {
          console.error('备用方案生成失败:', retryError);
          toast.error('无法生成备考规划，请稍后重试');
        }
      } else {
        toast.error('生成备考规划失败，请稍后重试');
      }
    } finally {
      setLoading(false);
    }
  };
  
  // 进度条宽度计算
  const progressWidth = () => {
    return `${(step / 2) * 100}%`;
  };
  
  // 计算距离考试的天数
  const getDaysUntilExam = () => {
    // 创建考试日期对象 - 2026年4月11-12日
    const examDate = new Date(2026, 3, 11);
    const today = new Date();
    
    // 计算天数差值并确保至少为1天
    const daysDiff = Math.max(1, Math.ceil((examDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
    return daysDiff;
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航栏 */}
      <div className="bg-white p-4 shadow-sm">
        <div className="container mx-auto flex items-center">
          <Link href="/" className="flex items-center text-gray-600 hover:text-gray-900">
            <ArrowLeft className="w-5 h-5 mr-2" />
            <span className="text-xl font-semibold">备考信息收集</span>
          </Link>
        </div>
      </div>
      
      {/* 进度条 */}
      <div className="w-full h-2 bg-gray-200">
        <div 
          className="h-full bg-indigo-500 transition-all duration-300"
          style={{ width: progressWidth() }}
        ></div>
      </div>
      
      <div className="container mx-auto px-4 py-8">
        {/* 考试信息提示 */}
        <div className="max-w-md mx-auto mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-start">
            <Calendar className="w-5 h-5 text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
            <div>
              <p className="text-sm text-blue-800 font-medium">
                初级护师职称考试时间为2026年4月11日-4月12日
              </p>
              <p className="text-sm text-blue-600 mt-1">
                距离考试还有 <span className="font-medium">{getDaysUntilExam()}</span> 天
              </p>
            </div>
          </div>
        </div>
        
        {/* 第一步：学习时间安排 */}
        {step === 1 && (
          <div className="max-w-md mx-auto">
            <h2 className="text-2xl font-semibold mb-6">学习时间安排</h2>
            
            <div className="mb-8">
              <h3 className="text-lg font-medium mb-4">您每周能抽出几天时间学习？</h3>
              <RadioGroup 
                value={formData.weekdaysCount}
                onValueChange={(value) => updateFormData('weekdaysCount', value as '1-2' | '3-4' | '5')}
                className="space-y-4"
              >
                <div className={`border ${formData.weekdaysCount === '1-2' ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200'} rounded-lg p-4`}>
                  <RadioGroupItem value="1-2" id="days-1-2" className="hidden" />
                  <Label htmlFor="days-1-2" className="flex items-center cursor-pointer">
                    <div className={`w-6 h-6 rounded-full border-2 ${formData.weekdaysCount === '1-2' ? 'border-indigo-500' : 'border-gray-300'} flex items-center justify-center mr-3`}>
                      {formData.weekdaysCount === '1-2' && (
                        <div className="w-3 h-3 bg-indigo-500 rounded-full"></div>
                      )}
                    </div>
                    <div>
                      <p className="font-medium">每周1-2天</p>
                    </div>
                  </Label>
                </div>
                
                <div className={`border ${formData.weekdaysCount === '3-4' ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200'} rounded-lg p-4`}>
                  <RadioGroupItem value="3-4" id="days-3-4" className="hidden" />
                  <Label htmlFor="days-3-4" className="flex items-center cursor-pointer">
                    <div className={`w-6 h-6 rounded-full border-2 ${formData.weekdaysCount === '3-4' ? 'border-indigo-500' : 'border-gray-300'} flex items-center justify-center mr-3`}>
                      {formData.weekdaysCount === '3-4' && (
                        <div className="w-3 h-3 bg-indigo-500 rounded-full"></div>
                      )}
                    </div>
                    <div>
                      <p className="font-medium">每周3-4天</p>
                    </div>
                  </Label>
                </div>
                
                <div className={`border ${formData.weekdaysCount === '5' ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200'} rounded-lg p-4`}>
                  <RadioGroupItem value="5" id="days-5" className="hidden" />
                  <Label htmlFor="days-5" className="flex items-center cursor-pointer">
                    <div className={`w-6 h-6 rounded-full border-2 ${formData.weekdaysCount === '5' ? 'border-indigo-500' : 'border-gray-300'} flex items-center justify-center mr-3`}>
                      {formData.weekdaysCount === '5' && (
                        <div className="w-3 h-3 bg-indigo-500 rounded-full"></div>
                      )}
                    </div>
                    <div>
                      <p className="font-medium">每周5天</p>
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </div>
            
            <div className="mb-8">
              <h3 className="text-lg font-medium mb-4">工作日每天能投入多少时间学习？</h3>
              <RadioGroup 
                value={formData.weekdayHours}
                onValueChange={(value) => updateFormData('weekdayHours', value as '<1' | '1-2' | '2-3' | '3+')}
                className="space-y-4"
              >
                <div className={`border ${formData.weekdayHours === '<1' ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200'} rounded-lg p-4`}>
                  <RadioGroupItem value="<1" id="weekday-less1" className="hidden" />
                  <Label htmlFor="weekday-less1" className="flex items-center cursor-pointer">
                    <div className={`w-6 h-6 rounded-full border-2 ${formData.weekdayHours === '<1' ? 'border-indigo-500' : 'border-gray-300'} flex items-center justify-center mr-3`}>
                      {formData.weekdayHours === '<1' && (
                        <div className="w-3 h-3 bg-indigo-500 rounded-full"></div>
                      )}
                    </div>
                    <div>
                      <p className="font-medium">不到1小时</p>
                    </div>
                  </Label>
                </div>
                
                <div className={`border ${formData.weekdayHours === '1-2' ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200'} rounded-lg p-4`}>
                  <RadioGroupItem value="1-2" id="weekday-1-2" className="hidden" />
                  <Label htmlFor="weekday-1-2" className="flex items-center cursor-pointer">
                    <div className={`w-6 h-6 rounded-full border-2 ${formData.weekdayHours === '1-2' ? 'border-indigo-500' : 'border-gray-300'} flex items-center justify-center mr-3`}>
                      {formData.weekdayHours === '1-2' && (
                        <div className="w-3 h-3 bg-indigo-500 rounded-full"></div>
                      )}
                    </div>
                    <div>
                      <p className="font-medium">1-2小时</p>
                    </div>
                  </Label>
                </div>
                
                <div className={`border ${formData.weekdayHours === '2-3' ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200'} rounded-lg p-4`}>
                  <RadioGroupItem value="2-3" id="weekday-2-3" className="hidden" />
                  <Label htmlFor="weekday-2-3" className="flex items-center cursor-pointer">
                    <div className={`w-6 h-6 rounded-full border-2 ${formData.weekdayHours === '2-3' ? 'border-indigo-500' : 'border-gray-300'} flex items-center justify-center mr-3`}>
                      {formData.weekdayHours === '2-3' && (
                        <div className="w-3 h-3 bg-indigo-500 rounded-full"></div>
                      )}
                    </div>
                    <div>
                      <p className="font-medium">2-3小时</p>
                    </div>
                  </Label>
                </div>
                
                <div className={`border ${formData.weekdayHours === '3+' ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200'} rounded-lg p-4`}>
                  <RadioGroupItem value="3+" id="weekday-3plus" className="hidden" />
                  <Label htmlFor="weekday-3plus" className="flex items-center cursor-pointer">
                    <div className={`w-6 h-6 rounded-full border-2 ${formData.weekdayHours === '3+' ? 'border-indigo-500' : 'border-gray-300'} flex items-center justify-center mr-3`}>
                      {formData.weekdayHours === '3+' && (
                        <div className="w-3 h-3 bg-indigo-500 rounded-full"></div>
                      )}
                    </div>
                    <div>
                      <p className="font-medium">3小时以上</p>
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </div>
            
            <div className="mt-8">
              <Button 
                className="w-full bg-indigo-600 hover:bg-indigo-700" 
                onClick={handleNext}
              >
                下一步
              </Button>
            </div>
          </div>
        )}
        
        {/* 第二步：周末学习时间 */}
        {step === 2 && (
          <div className="max-w-md mx-auto">
            <h2 className="text-2xl font-semibold mb-6">周末学习时间安排</h2>
            
            <div className="mb-8">
              <h3 className="text-lg font-medium mb-4">周末每天能投入多少时间学习？</h3>
              <RadioGroup 
                value={formData.weekendHours}
                onValueChange={(value) => updateFormData('weekendHours', value as '<2' | '2-4' | '4-6' | '6+')}
                className="space-y-4"
              >
                <div className={`border ${formData.weekendHours === '<2' ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200'} rounded-lg p-4`}>
                  <RadioGroupItem value="<2" id="weekend-less2" className="hidden" />
                  <Label htmlFor="weekend-less2" className="flex items-center cursor-pointer">
                    <div className={`w-6 h-6 rounded-full border-2 ${formData.weekendHours === '<2' ? 'border-indigo-500' : 'border-gray-300'} flex items-center justify-center mr-3`}>
                      {formData.weekendHours === '<2' && (
                        <div className="w-3 h-3 bg-indigo-500 rounded-full"></div>
                      )}
                    </div>
                    <div>
                      <p className="font-medium">不到2小时</p>
                    </div>
                  </Label>
                </div>
                
                <div className={`border ${formData.weekendHours === '2-4' ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200'} rounded-lg p-4`}>
                  <RadioGroupItem value="2-4" id="weekend-2-4" className="hidden" />
                  <Label htmlFor="weekend-2-4" className="flex items-center cursor-pointer">
                    <div className={`w-6 h-6 rounded-full border-2 ${formData.weekendHours === '2-4' ? 'border-indigo-500' : 'border-gray-300'} flex items-center justify-center mr-3`}>
                      {formData.weekendHours === '2-4' && (
                        <div className="w-3 h-3 bg-indigo-500 rounded-full"></div>
                      )}
                    </div>
                    <div>
                      <p className="font-medium">2-4小时</p>
                    </div>
                  </Label>
                </div>
                
                <div className={`border ${formData.weekendHours === '4-6' ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200'} rounded-lg p-4`}>
                  <RadioGroupItem value="4-6" id="weekend-4-6" className="hidden" />
                  <Label htmlFor="weekend-4-6" className="flex items-center cursor-pointer">
                    <div className={`w-6 h-6 rounded-full border-2 ${formData.weekendHours === '4-6' ? 'border-indigo-500' : 'border-gray-300'} flex items-center justify-center mr-3`}>
                      {formData.weekendHours === '4-6' && (
                        <div className="w-3 h-3 bg-indigo-500 rounded-full"></div>
                      )}
                    </div>
                    <div>
                      <p className="font-medium">4-6小时</p>
                    </div>
                  </Label>
                </div>
                
                <div className={`border ${formData.weekendHours === '6+' ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200'} rounded-lg p-4`}>
                  <RadioGroupItem value="6+" id="weekend-6plus" className="hidden" />
                  <Label htmlFor="weekend-6plus" className="flex items-center cursor-pointer">
                    <div className={`w-6 h-6 rounded-full border-2 ${formData.weekendHours === '6+' ? 'border-indigo-500' : 'border-gray-300'} flex items-center justify-center mr-3`}>
                      {formData.weekendHours === '6+' && (
                        <div className="w-3 h-3 bg-indigo-500 rounded-full"></div>
                      )}
                    </div>
                    <div>
                      <p className="font-medium">6小时以上</p>
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </div>
            
            <div className="mb-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="flex">
                <Info className="w-5 h-5 text-yellow-500 mt-0.5 mr-2 flex-shrink-0" />
                <p className="text-sm text-yellow-800">
                  系统将为您生成初级护师考试四个科目（基础知识、相关专业知识、专业知识、专业实践能力）的完整备考规划，每日任务将根据您可用的学习时间合理安排。
                </p>
              </div>
            </div>
            
            <div className="mt-8 flex justify-between">
              <Button 
                variant="outline" 
                onClick={handlePrevious}
              >
                上一步
              </Button>
              <Button 
                className="bg-indigo-600 hover:bg-indigo-700"
                onClick={handleNext}
                disabled={loading}
              >
                {loading ? '生成中...' : '生成备考规划'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 