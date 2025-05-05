'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { SurveyFormData } from '@/types/survey';
import { useAuthStore } from '@/store/use-auth-store';
import { createStudyPlan } from '@/lib/db-client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function SurveyPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // 获取当前年份和未来年份列表
  const currentYear = new Date().getFullYear();
  const currentDate = new Date();
  const examDateThisYear = new Date(currentYear, 3, 13); // 4月13日，月份从0开始计数
  
  // 检查当前日期是否已过今年的考试日期
  const startYear = currentDate > examDateThisYear ? currentYear + 1 : currentYear;
  const futureYears = Array.from({ length: 5 }, (_, i) => (startYear + i).toString());
  
  // 表单数据
  const [formData, setFormData] = useState<SurveyFormData>({
    // 考试基本信息
    titleLevel: 'junior', // 初级护师、主管护师、其他
    otherTitleLevel: '', // 若选择"其他"则填写
    examStatus: 'first', // 首次参加考试、已通过部分科目
    examYear: startYear.toString(), // 考试年份，默认为可选的第一年
    
    // 考试科目选择（若已通过部分科目才需填写）
    subjects: {
      basic: false, // 基础知识
      related: false, // 相关专业知识
      professional: false, // 专业知识
      practical: false, // 实践能力
    },
    
    // 学习基础评估
    overallLevel: 'weak', // 基础薄弱、有一定基础、基础扎实
    subjectLevels: {
      basic: 'low', // 基础知识水平
      related: 'low', // 相关专业知识水平
      professional: 'low', // 专业知识水平
      practical: 'low', // 实践能力水平
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
  
  // 更新考试科目选择
  const updateSubject = (subject: keyof SurveyFormData['subjects'], checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      subjects: {
        ...prev.subjects,
        [subject]: checked
      }
    }));
  };
  
  // 更新科目水平评估
  const updateSubjectLevel = (subject: keyof SurveyFormData['subjectLevels'], level: 'low' | 'medium' | 'high') => {
    setFormData(prev => ({
      ...prev,
      subjectLevels: {
        ...prev.subjectLevels,
        [subject]: level
      }
    }));
  };
  
  // 处理下一步
  const handleNext = () => {
    // 添加表单验证逻辑
    if (step === 1) {
      if (formData.titleLevel === 'other' && !formData.otherTitleLevel.trim()) {
        toast.error('请填写您要报考的职称等级');
        return;
      }
    } else if (step === 2 && formData.examStatus === 'partial') {
      // 检查是否至少选择了一个科目
      const hasSelectedSubject = Object.values(formData.subjects).some(v => v);
      if (!hasSelectedSubject) {
        toast.error('请至少选择一个需要考试的科目');
        return;
      }
    }
    
    // 跳过Q3如果是首次参加考试
    if (step === 1 && formData.examStatus === 'first') {
      setStep(3);
    } else if (step < 5) {
      setStep(s => s + 1);
    } else {
      generatePlan();
    }
  };
  
  // 处理上一步
  const handlePrevious = () => {
    // 跳过Q3如果是首次参加考试
    if (step === 3 && formData.examStatus === 'first') {
      setStep(1);
    } else if (step > 1) {
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
  
  // 计算总步数
  const totalSteps = () => {
    return formData.examStatus === 'first' ? 4 : 5;
  };
  
  // 进度条宽度计算
  const progressWidth = () => {
    return `${(step / totalSteps()) * 100}%`;
  };
  
  // 计算距离考试的天数
  const getDaysUntilExam = () => {
    const examYear = parseInt(formData.examYear);
    // 创建考试日期对象 - 每年4月13日
    const examDate = new Date(examYear, 3, 13); // 4月13日，月份从0开始
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
        {/* 第一步：考试基本信息 */}
        {step === 1 && (
          <div className="max-w-md mx-auto">
            <h2 className="text-2xl font-semibold mb-6">考试基本信息</h2>
            
            <div className="mb-8">
              <h3 className="text-lg font-medium mb-4">您准备报考的护理职称等级是？</h3>
              <RadioGroup 
                value={formData.titleLevel}
                onValueChange={(value) => updateFormData('titleLevel', value as 'junior' | 'mid' | 'other')}
                className="space-y-4"
              >
                <div className={`border ${formData.titleLevel === 'junior' ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200'} rounded-lg p-4`}>
                  <RadioGroupItem value="junior" id="title-junior" className="hidden" />
                  <Label htmlFor="title-junior" className="flex items-center cursor-pointer">
                    <div className={`w-6 h-6 rounded-full border-2 ${formData.titleLevel === 'junior' ? 'border-indigo-500' : 'border-gray-300'} flex items-center justify-center mr-3`}>
                      {formData.titleLevel === 'junior' && (
                        <div className="w-3 h-3 bg-indigo-500 rounded-full"></div>
                      )}
                    </div>
                    <div>
                      <p className="font-medium">初级护师</p>
                    </div>
                  </Label>
                </div>
                
                <div className={`border ${formData.titleLevel === 'mid' ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200'} rounded-lg p-4`}>
                  <RadioGroupItem value="mid" id="title-mid" className="hidden" />
                  <Label htmlFor="title-mid" className="flex items-center cursor-pointer">
                    <div className={`w-6 h-6 rounded-full border-2 ${formData.titleLevel === 'mid' ? 'border-indigo-500' : 'border-gray-300'} flex items-center justify-center mr-3`}>
                      {formData.titleLevel === 'mid' && (
                        <div className="w-3 h-3 bg-indigo-500 rounded-full"></div>
                      )}
                    </div>
                    <div>
                      <p className="font-medium">主管护师</p>
                    </div>
                  </Label>
                </div>
                
                <div className={`border ${formData.titleLevel === 'other' ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200'} rounded-lg p-4`}>
                  <RadioGroupItem value="other" id="title-other" className="hidden" />
                  <Label htmlFor="title-other" className="flex items-center cursor-pointer">
                    <div className={`w-6 h-6 rounded-full border-2 ${formData.titleLevel === 'other' ? 'border-indigo-500' : 'border-gray-300'} flex items-center justify-center mr-3`}>
                      {formData.titleLevel === 'other' && (
                        <div className="w-3 h-3 bg-indigo-500 rounded-full"></div>
                      )}
                    </div>
                    <div className="w-full">
                      <p className="font-medium">其他（请填写）</p>
                      {formData.titleLevel === 'other' && (
                        <Input 
                          className="mt-2"
                          value={formData.otherTitleLevel}
                          onChange={(e) => updateFormData('otherTitleLevel', e.target.value)}
                          placeholder="请填写您要报考的职称等级"
                        />
                      )}
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </div>
            
            <div className="mb-8">
              <h3 className="text-lg font-medium mb-4">您是首次参加此级别考试，还是已通过部分科目？</h3>
              <RadioGroup 
                value={formData.examStatus}
                onValueChange={(value) => updateFormData('examStatus', value as 'first' | 'partial')}
                className="space-y-4"
              >
                <div className={`border ${formData.examStatus === 'first' ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200'} rounded-lg p-4`}>
                  <RadioGroupItem value="first" id="status-first" className="hidden" />
                  <Label htmlFor="status-first" className="flex items-center cursor-pointer">
                    <div className={`w-6 h-6 rounded-full border-2 ${formData.examStatus === 'first' ? 'border-indigo-500' : 'border-gray-300'} flex items-center justify-center mr-3`}>
                      {formData.examStatus === 'first' && (
                        <div className="w-3 h-3 bg-indigo-500 rounded-full"></div>
                      )}
                    </div>
                    <div>
                      <p className="font-medium">首次参加考试</p>
                    </div>
                  </Label>
                </div>
                
                <div className={`border ${formData.examStatus === 'partial' ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200'} rounded-lg p-4`}>
                  <RadioGroupItem value="partial" id="status-partial" className="hidden" />
                  <Label htmlFor="status-partial" className="flex items-center cursor-pointer">
                    <div className={`w-6 h-6 rounded-full border-2 ${formData.examStatus === 'partial' ? 'border-indigo-500' : 'border-gray-300'} flex items-center justify-center mr-3`}>
                      {formData.examStatus === 'partial' && (
                        <div className="w-3 h-3 bg-indigo-500 rounded-full"></div>
                      )}
                    </div>
                    <div>
                      <p className="font-medium">已通过部分科目（2年内有效）</p>
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="mb-8">
              <h3 className="text-lg font-medium mb-4">您预计参与考试的年份？（默认考试日期为每年的4月13日）</h3>
              <Select
                value={formData.examYear}
                onValueChange={(value) => updateFormData('examYear', value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="选择考试年份" />
                </SelectTrigger>
                <SelectContent>
                  {futureYears.map((year) => (
                    <SelectItem key={year} value={year}>
                      {year}年
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {formData.examYear && (
                <p className="mt-4 text-gray-600">
                  考试日期：{formData.examYear}年4月13日，距离考试还有 <span className="font-medium">
                    {getDaysUntilExam()}
                  </span> 天
                </p>
              )}
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
        
        {/* 第二步：考试科目选择（若已通过部分科目才显示） */}
        {step === 2 && formData.examStatus === 'partial' && (
          <div className="max-w-md mx-auto">
            <h2 className="text-2xl font-semibold mb-6">考试科目选择</h2>
            
            <div className="mb-8">
              <h3 className="text-lg font-medium mb-4">请选择您本次需要考试的科目：</h3>
              
              <div className="space-y-4">
                <div className={`border ${formData.subjects.basic ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200'} rounded-lg p-4`}>
                  <div className="flex items-center">
                    <Checkbox 
                      id="subject-basic" 
                      checked={formData.subjects.basic}
                      onCheckedChange={(checked: boolean) => updateSubject('basic', checked)}
                      className="mr-3 h-5 w-5"
                    />
                    <Label htmlFor="subject-basic" className="cursor-pointer">
                      基础知识
                    </Label>
                  </div>
                </div>
                
                <div className={`border ${formData.subjects.related ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200'} rounded-lg p-4`}>
                  <div className="flex items-center">
                    <Checkbox 
                      id="subject-related" 
                      checked={formData.subjects.related}
                      onCheckedChange={(checked: boolean) => updateSubject('related', checked)}
                      className="mr-3 h-5 w-5"
                    />
                    <Label htmlFor="subject-related" className="cursor-pointer">
                      相关专业知识
                    </Label>
                  </div>
                </div>
                
                <div className={`border ${formData.subjects.professional ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200'} rounded-lg p-4`}>
                  <div className="flex items-center">
                    <Checkbox 
                      id="subject-professional" 
                      checked={formData.subjects.professional}
                      onCheckedChange={(checked: boolean) => updateSubject('professional', checked)}
                      className="mr-3 h-5 w-5"
                    />
                    <Label htmlFor="subject-professional" className="cursor-pointer">
                      专业知识
                    </Label>
                  </div>
                </div>
                
                <div className={`border ${formData.subjects.practical ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200'} rounded-lg p-4`}>
                  <div className="flex items-center">
                    <Checkbox 
                      id="subject-practical" 
                      checked={formData.subjects.practical}
                      onCheckedChange={(checked: boolean) => updateSubject('practical', checked)}
                      className="mr-3 h-5 w-5"
                    />
                    <Label htmlFor="subject-practical" className="cursor-pointer">
                      实践能力
                    </Label>
                  </div>
                </div>
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
              >
                下一步
              </Button>
            </div>
          </div>
        )}
        
        {/* 第三步：学习基础评估 */}
        {step === 3 && (
          <div className="max-w-md mx-auto">
            <h2 className="text-2xl font-semibold mb-6">学习基础评估</h2>
            
            {/* 首次参加考试显示总体评估 */}
            {formData.examStatus === 'first' && (
              <div className="mb-8">
                <h3 className="text-lg font-medium mb-4">您如何评价自己的总体学习基础？</h3>
                <RadioGroup 
                  value={formData.overallLevel}
                  onValueChange={(value) => updateFormData('overallLevel', value as 'weak' | 'medium' | 'strong')}
                  className="space-y-4"
                >
                  <div className={`border ${formData.overallLevel === 'weak' ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200'} rounded-lg p-4`}>
                    <RadioGroupItem value="weak" id="level-weak" className="hidden" />
                    <Label htmlFor="level-weak" className="flex items-center cursor-pointer">
                      <div className={`w-6 h-6 rounded-full border-2 ${formData.overallLevel === 'weak' ? 'border-indigo-500' : 'border-gray-300'} flex items-center justify-center mr-3`}>
                        {formData.overallLevel === 'weak' && (
                          <div className="w-3 h-3 bg-indigo-500 rounded-full"></div>
                        )}
                      </div>
                      <div>
                        <p className="font-medium">★ 基础薄弱，需要从头开始</p>
                      </div>
                    </Label>
                  </div>
                  
                  <div className={`border ${formData.overallLevel === 'medium' ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200'} rounded-lg p-4`}>
                    <RadioGroupItem value="medium" id="level-medium" className="hidden" />
                    <Label htmlFor="level-medium" className="flex items-center cursor-pointer">
                      <div className={`w-6 h-6 rounded-full border-2 ${formData.overallLevel === 'medium' ? 'border-indigo-500' : 'border-gray-300'} flex items-center justify-center mr-3`}>
                        {formData.overallLevel === 'medium' && (
                          <div className="w-3 h-3 bg-indigo-500 rounded-full"></div>
                        )}
                      </div>
                      <div>
                        <p className="font-medium">★★ 有一定基础，部分内容需要加强</p>
                      </div>
                    </Label>
                  </div>
                  
                  <div className={`border ${formData.overallLevel === 'strong' ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200'} rounded-lg p-4`}>
                    <RadioGroupItem value="strong" id="level-strong" className="hidden" />
                    <Label htmlFor="level-strong" className="flex items-center cursor-pointer">
                      <div className={`w-6 h-6 rounded-full border-2 ${formData.overallLevel === 'strong' ? 'border-indigo-500' : 'border-gray-300'} flex items-center justify-center mr-3`}>
                        {formData.overallLevel === 'strong' && (
                          <div className="w-3 h-3 bg-indigo-500 rounded-full"></div>
                        )}
                      </div>
                      <div>
                        <p className="font-medium">★★★ 基础扎实，需要系统复习</p>
                      </div>
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            )}
            
            {/* 已通过部分科目显示各科目评估 */}
            {formData.examStatus === 'partial' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium">请为您本次需要考试的各科目评估基础水平：</h3>
                
                {formData.subjects.basic && (
                  <div className="mb-4">
                    <h4 className="font-medium mb-2">基础知识：</h4>
                    <RadioGroup 
                      value={formData.subjectLevels.basic}
                      onValueChange={(value) => updateSubjectLevel('basic', value as 'low' | 'medium' | 'high')}
                      className="space-y-2"
                    >
                      <div className="flex items-center">
                        <RadioGroupItem value="low" id="basic-low" />
                        <Label htmlFor="basic-low" className="ml-2">★ 了解较少</Label>
                      </div>
                      <div className="flex items-center">
                        <RadioGroupItem value="medium" id="basic-medium" />
                        <Label htmlFor="basic-medium" className="ml-2">★★ 一般了解</Label>
                      </div>
                      <div className="flex items-center">
                        <RadioGroupItem value="high" id="basic-high" />
                        <Label htmlFor="basic-high" className="ml-2">★★★ 熟悉掌握</Label>
                      </div>
                    </RadioGroup>
                  </div>
                )}
                
                {formData.subjects.related && (
                  <div className="mb-4">
                    <h4 className="font-medium mb-2">相关专业知识：</h4>
                    <RadioGroup 
                      value={formData.subjectLevels.related}
                      onValueChange={(value) => updateSubjectLevel('related', value as 'low' | 'medium' | 'high')}
                      className="space-y-2"
                    >
                      <div className="flex items-center">
                        <RadioGroupItem value="low" id="related-low" />
                        <Label htmlFor="related-low" className="ml-2">★ 了解较少</Label>
                      </div>
                      <div className="flex items-center">
                        <RadioGroupItem value="medium" id="related-medium" />
                        <Label htmlFor="related-medium" className="ml-2">★★ 一般了解</Label>
                      </div>
                      <div className="flex items-center">
                        <RadioGroupItem value="high" id="related-high" />
                        <Label htmlFor="related-high" className="ml-2">★★★ 熟悉掌握</Label>
                      </div>
                    </RadioGroup>
                  </div>
                )}
                
                {formData.subjects.professional && (
                  <div className="mb-4">
                    <h4 className="font-medium mb-2">专业知识：</h4>
                    <RadioGroup 
                      value={formData.subjectLevels.professional}
                      onValueChange={(value) => updateSubjectLevel('professional', value as 'low' | 'medium' | 'high')}
                      className="space-y-2"
                    >
                      <div className="flex items-center">
                        <RadioGroupItem value="low" id="professional-low" />
                        <Label htmlFor="professional-low" className="ml-2">★ 了解较少</Label>
                      </div>
                      <div className="flex items-center">
                        <RadioGroupItem value="medium" id="professional-medium" />
                        <Label htmlFor="professional-medium" className="ml-2">★★ 一般了解</Label>
                      </div>
                      <div className="flex items-center">
                        <RadioGroupItem value="high" id="professional-high" />
                        <Label htmlFor="professional-high" className="ml-2">★★★ 熟悉掌握</Label>
                      </div>
                    </RadioGroup>
                  </div>
                )}
                
                {formData.subjects.practical && (
                  <div className="mb-4">
                    <h4 className="font-medium mb-2">实践能力：</h4>
                    <RadioGroup 
                      value={formData.subjectLevels.practical}
                      onValueChange={(value) => updateSubjectLevel('practical', value as 'low' | 'medium' | 'high')}
                      className="space-y-2"
                    >
                      <div className="flex items-center">
                        <RadioGroupItem value="low" id="practical-low" />
                        <Label htmlFor="practical-low" className="ml-2">★ 了解较少</Label>
                      </div>
                      <div className="flex items-center">
                        <RadioGroupItem value="medium" id="practical-medium" />
                        <Label htmlFor="practical-medium" className="ml-2">★★ 一般了解</Label>
                      </div>
                      <div className="flex items-center">
                        <RadioGroupItem value="high" id="practical-high" />
                        <Label htmlFor="practical-high" className="ml-2">★★★ 熟悉掌握</Label>
                      </div>
                    </RadioGroup>
                  </div>
                )}
              </div>
            )}
            
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
              >
                下一步
              </Button>
            </div>
          </div>
        )}
        
        {/* 第四步：学习时间安排 - 每周学习天数 */}
        {step === 4 && (
          <div className="max-w-md mx-auto">
            <h2 className="text-2xl font-semibold mb-6">学习时间安排</h2>
            
            <div className="mb-8">
              <h3 className="text-lg font-medium mb-4">您平均每周能安排几天进行工作日学习？</h3>
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
                      <p className="font-medium">1-2天</p>
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
                      <p className="font-medium">3-4天</p>
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
                      <p className="font-medium">5天（每个工作日）</p>
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </div>
            
            <div className="mb-8">
              <h3 className="text-lg font-medium mb-4">工作日平均每天能投入多少小时学习？</h3>
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
            
            <div className="mb-8">
              <h3 className="text-lg font-medium mb-4">周末平均每天能投入多少小时学习？</h3>
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
            
            <div className="mt-8 flex justify-between">
              <Button 
                variant="outline" 
                onClick={handlePrevious}
              >
                上一步
              </Button>
              <Button 
                className="bg-indigo-600 hover:bg-indigo-700"
                onClick={generatePlan}
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