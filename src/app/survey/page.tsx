'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { ArrowLeft } from 'lucide-react';
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
  
  // 表单数据
  const [formData, setFormData] = useState<SurveyFormData>({
    profession: 'nursing', // 默认选择护理类
    currentTitle: 'mid', // 默认选择中级职称
    targetTitle: 'mid', // 默认选择中级职称
    studyTimePerDay: '4+', // 默认选择4小时以上
    examDate: '2025-05-21', // 默认考试日期
  });
  
  // 更新表单数据
  const updateFormData = (key: keyof SurveyFormData, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };
  
  // 处理下一步
  const handleNext = () => {
    if (step < 5) {
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
      toast.error('生成备考规划失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };
  
  // 进度条宽度计算
  const progressWidth = () => {
    return `${(step / 5) * 100}%`;
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
        {/* 第一步：专业类别 */}
        {step === 1 && (
          <div className="max-w-md mx-auto">
            <h2 className="text-2xl font-semibold mb-6">您所属的专业类别是？</h2>
            
            <RadioGroup 
              value={formData.profession}
              onValueChange={(value) => updateFormData('profession', value)}
              className="space-y-4"
            >
              <div className={`border ${formData.profession === 'medical' ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200'} rounded-lg p-4`}>
                <RadioGroupItem value="medical" id="medical" className="hidden" />
                <Label htmlFor="medical" className="flex items-center cursor-pointer">
                  <div className={`w-6 h-6 rounded-full border-2 ${formData.profession === 'medical' ? 'border-indigo-500' : 'border-gray-300'} flex items-center justify-center mr-3`}>
                    {formData.profession === 'medical' && (
                      <div className="w-3 h-3 bg-indigo-500 rounded-full"></div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-medium">医疗类</h3>
                    <p className="text-sm text-gray-600">医士/医师、主治医师、副主任医师、主任医师</p>
                  </div>
                </Label>
              </div>
              
              <div className={`border ${formData.profession === 'nursing' ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200'} rounded-lg p-4`}>
                <RadioGroupItem value="nursing" id="nursing" className="hidden" />
                <Label htmlFor="nursing" className="flex items-center cursor-pointer">
                  <div className={`w-6 h-6 rounded-full border-2 ${formData.profession === 'nursing' ? 'border-indigo-500' : 'border-gray-300'} flex items-center justify-center mr-3`}>
                    {formData.profession === 'nursing' && (
                      <div className="w-3 h-3 bg-indigo-500 rounded-full"></div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-medium">护理类</h3>
                    <p className="text-sm text-gray-600">护士/护师、主管护师、副主任护师、主任护师</p>
                  </div>
                </Label>
              </div>
              
              <div className={`border ${formData.profession === 'pharmacy' ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200'} rounded-lg p-4`}>
                <RadioGroupItem value="pharmacy" id="pharmacy" className="hidden" />
                <Label htmlFor="pharmacy" className="flex items-center cursor-pointer">
                  <div className={`w-6 h-6 rounded-full border-2 ${formData.profession === 'pharmacy' ? 'border-indigo-500' : 'border-gray-300'} flex items-center justify-center mr-3`}>
                    {formData.profession === 'pharmacy' && (
                      <div className="w-3 h-3 bg-indigo-500 rounded-full"></div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-medium">药技类</h3>
                    <p className="text-sm text-gray-600">药(技)士/药(技)师、主管药(技)师、副主任药师/副主任技师、主任药师/主任技师</p>
                  </div>
                </Label>
              </div>
            </RadioGroup>
            
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
        
        {/* 第二步：当前职称等级 */}
        {step === 2 && (
          <div className="max-w-md mx-auto">
            <h2 className="text-2xl font-semibold mb-6">您当前的职称等级是？</h2>
            
            <RadioGroup 
              value={formData.currentTitle}
              onValueChange={(value) => updateFormData('currentTitle', value)}
              className="space-y-4"
            >
              <div className={`border ${formData.currentTitle === 'none' ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200'} rounded-lg p-4`}>
                <RadioGroupItem value="none" id="current-none" className="hidden" />
                <Label htmlFor="current-none" className="flex items-center cursor-pointer">
                  <div className={`w-6 h-6 rounded-full border-2 ${formData.currentTitle === 'none' ? 'border-indigo-500' : 'border-gray-300'} flex items-center justify-center mr-3`}>
                    {formData.currentTitle === 'none' && (
                      <div className="w-3 h-3 bg-indigo-500 rounded-full"></div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-medium">无职称</h3>
                    <p className="text-sm text-gray-600">尚未取得职称</p>
                  </div>
                </Label>
              </div>
              
              <div className={`border ${formData.currentTitle === 'junior' ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200'} rounded-lg p-4`}>
                <RadioGroupItem value="junior" id="current-junior" className="hidden" />
                <Label htmlFor="current-junior" className="flex items-center cursor-pointer">
                  <div className={`w-6 h-6 rounded-full border-2 ${formData.currentTitle === 'junior' ? 'border-indigo-500' : 'border-gray-300'} flex items-center justify-center mr-3`}>
                    {formData.currentTitle === 'junior' && (
                      <div className="w-3 h-3 bg-indigo-500 rounded-full"></div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-medium">初级职称</h3>
                    <p className="text-sm text-gray-600">如：医士/医师、护士/护师、药(技)士/药(技)师</p>
                  </div>
                </Label>
              </div>
              
              <div className={`border ${formData.currentTitle === 'mid' ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200'} rounded-lg p-4`}>
                <RadioGroupItem value="mid" id="current-mid" className="hidden" />
                <Label htmlFor="current-mid" className="flex items-center cursor-pointer">
                  <div className={`w-6 h-6 rounded-full border-2 ${formData.currentTitle === 'mid' ? 'border-indigo-500' : 'border-gray-300'} flex items-center justify-center mr-3`}>
                    {formData.currentTitle === 'mid' && (
                      <div className="w-3 h-3 bg-indigo-500 rounded-full"></div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-medium">中级职称</h3>
                    <p className="text-sm text-gray-600">如：主治医师/主管医师、主管护师、主管药(技)师</p>
                  </div>
                </Label>
              </div>
            </RadioGroup>
            
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
        
        {/* 第三步：目标职称 */}
        {step === 3 && (
          <div className="max-w-md mx-auto">
            <h2 className="text-2xl font-semibold mb-6">您的目标职称等级是？</h2>
            
            <RadioGroup 
              value={formData.targetTitle}
              onValueChange={(value) => updateFormData('targetTitle', value)}
              className="space-y-4"
            >
              <div className={`border ${formData.targetTitle === 'mid' ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200'} rounded-lg p-4`}>
                <RadioGroupItem value="mid" id="target-mid" className="hidden" />
                <Label htmlFor="target-mid" className="flex items-center cursor-pointer">
                  <div className={`w-6 h-6 rounded-full border-2 ${formData.targetTitle === 'mid' ? 'border-indigo-500' : 'border-gray-300'} flex items-center justify-center mr-3`}>
                    {formData.targetTitle === 'mid' && (
                      <div className="w-3 h-3 bg-indigo-500 rounded-full"></div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-medium">中级职称</h3>
                    <p className="text-sm text-gray-600">主管护师</p>
                  </div>
                </Label>
              </div>
              
              <div className={`border ${formData.targetTitle === 'associate' ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200'} rounded-lg p-4`}>
                <RadioGroupItem value="associate" id="target-associate" className="hidden" />
                <Label htmlFor="target-associate" className="flex items-center cursor-pointer">
                  <div className={`w-6 h-6 rounded-full border-2 ${formData.targetTitle === 'associate' ? 'border-indigo-500' : 'border-gray-300'} flex items-center justify-center mr-3`}>
                    {formData.targetTitle === 'associate' && (
                      <div className="w-3 h-3 bg-indigo-500 rounded-full"></div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-medium">副高级</h3>
                    <p className="text-sm text-gray-600">副主任护师</p>
                  </div>
                </Label>
              </div>
              
              <div className={`border ${formData.targetTitle === 'senior' ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200'} rounded-lg p-4`}>
                <RadioGroupItem value="senior" id="target-senior" className="hidden" />
                <Label htmlFor="target-senior" className="flex items-center cursor-pointer">
                  <div className={`w-6 h-6 rounded-full border-2 ${formData.targetTitle === 'senior' ? 'border-indigo-500' : 'border-gray-300'} flex items-center justify-center mr-3`}>
                    {formData.targetTitle === 'senior' && (
                      <div className="w-3 h-3 bg-indigo-500 rounded-full"></div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-medium">正高级</h3>
                    <p className="text-sm text-gray-600">主任护师</p>
                  </div>
                </Label>
              </div>
            </RadioGroup>
            
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
        
        {/* 第四步：学习时间 */}
        {step === 4 && (
          <div className="max-w-md mx-auto">
            <h2 className="text-2xl font-semibold mb-6">您每天可以用于备考的时间是？</h2>
            
            <RadioGroup 
              value={formData.studyTimePerDay}
              onValueChange={(value) => updateFormData('studyTimePerDay', value)}
              className="space-y-4"
            >
              <div className={`border ${formData.studyTimePerDay === '<1' ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200'} rounded-lg p-4`}>
                <RadioGroupItem value="<1" id="time-less1" className="hidden" />
                <Label htmlFor="time-less1" className="flex items-center cursor-pointer">
                  <div className={`w-6 h-6 rounded-full border-2 ${formData.studyTimePerDay === '<1' ? 'border-indigo-500' : 'border-gray-300'} flex items-center justify-center mr-3`}>
                    {formData.studyTimePerDay === '<1' && (
                      <div className="w-3 h-3 bg-indigo-500 rounded-full"></div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-medium">少于1小时</h3>
                    <p className="text-sm text-gray-600">工作较忙，仅有零散时间</p>
                  </div>
                </Label>
              </div>
              
              <div className={`border ${formData.studyTimePerDay === '1-2' ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200'} rounded-lg p-4`}>
                <RadioGroupItem value="1-2" id="time-1-2" className="hidden" />
                <Label htmlFor="time-1-2" className="flex items-center cursor-pointer">
                  <div className={`w-6 h-6 rounded-full border-2 ${formData.studyTimePerDay === '1-2' ? 'border-indigo-500' : 'border-gray-300'} flex items-center justify-center mr-3`}>
                    {formData.studyTimePerDay === '1-2' && (
                      <div className="w-3 h-3 bg-indigo-500 rounded-full"></div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-medium">1-2小时</h3>
                    <p className="text-sm text-gray-600">有一定的学习时间</p>
                  </div>
                </Label>
              </div>
              
              <div className={`border ${formData.studyTimePerDay === '2-4' ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200'} rounded-lg p-4`}>
                <RadioGroupItem value="2-4" id="time-2-4" className="hidden" />
                <Label htmlFor="time-2-4" className="flex items-center cursor-pointer">
                  <div className={`w-6 h-6 rounded-full border-2 ${formData.studyTimePerDay === '2-4' ? 'border-indigo-500' : 'border-gray-300'} flex items-center justify-center mr-3`}>
                    {formData.studyTimePerDay === '2-4' && (
                      <div className="w-3 h-3 bg-indigo-500 rounded-full"></div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-medium">2-4小时</h3>
                    <p className="text-sm text-gray-600">有较多的学习时间</p>
                  </div>
                </Label>
              </div>
              
              <div className={`border ${formData.studyTimePerDay === '4+' ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200'} rounded-lg p-4`}>
                <RadioGroupItem value="4+" id="time-4plus" className="hidden" />
                <Label htmlFor="time-4plus" className="flex items-center cursor-pointer">
                  <div className={`w-6 h-6 rounded-full border-2 ${formData.studyTimePerDay === '4+' ? 'border-indigo-500' : 'border-gray-300'} flex items-center justify-center mr-3`}>
                    {formData.studyTimePerDay === '4+' && (
                      <div className="w-3 h-3 bg-indigo-500 rounded-full"></div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-medium">4小时以上</h3>
                    <p className="text-sm text-gray-600">全职备考</p>
                  </div>
                </Label>
              </div>
            </RadioGroup>
            
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
        
        {/* 第五步：考试日期 */}
        {step === 5 && (
          <div className="max-w-md mx-auto">
            <h2 className="text-2xl font-semibold mb-6">您计划的考试时间是？</h2>
            
            <div className="mb-8">
              <p className="text-gray-700 mb-3">选择考试日期</p>
              <Input 
                type="date" 
                value={formData.examDate}
                onChange={(e) => updateFormData('examDate', e.target.value)}
                className="w-full"
              />
              
              {formData.examDate && (
                <p className="mt-4 text-gray-600">
                  距离考试还有 <span className="font-medium">
                    {Math.floor((new Date(formData.examDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))}
                  </span> 天
                </p>
              )}
            </div>
            
            <div className="flex justify-between">
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