'use client';

/**
 * @description 用户反馈表单组件
 * @author 郝桃桃
 * @date 2024-05-10
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuthStore } from '@/store/use-auth-store';
import { toast } from 'sonner';

interface FeedbackFormProps {
  onClose: () => void;
  source?: string;
  onSuccess?: () => void;
}

export function FeedbackForm({ onClose, source = 'study_plans', onSuccess }: FeedbackFormProps) {
  const { user } = useAuthStore();
  const [satisfaction, setSatisfaction] = useState<number>(7);
  const [suggestion, setSuggestion] = useState<string>('');
  const [willContact, setWillContact] = useState<boolean>(false);
  const [contactPhone, setContactPhone] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  
  // 提交反馈
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.id) {
      toast.error('请先登录');
      return;
    }
    
    if (satisfaction < 1 || satisfaction > 10) {
      toast.error('请选择1-10的满意度评分');
      return;
    }
    
    if (willContact && !contactPhone) {
      toast.error('请填写联系电话');
      return;
    }
    
    if (willContact && !/^1[3-9]\d{9}$/.test(contactPhone)) {
      toast.error('请填写正确的手机号码');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/feedbacks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          satisfaction,
          suggestion,
          contactPhone,
          willContact,
          source
        }),
      });
      
      if (!response.ok) {
        throw new Error('提交反馈失败');
      }
      
      const result = await response.json();
      
      if (result.success) {
        toast.success('感谢您的反馈！');
        if (onSuccess) onSuccess();
        onClose();
      } else {
        throw new Error(result.error || '提交反馈失败');
      }
    } catch (error: any) {
      console.error('提交反馈失败:', error);
      toast.error(error.message || '提交反馈失败，请稍后再试');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <h3 className="text-lg font-medium">您的反馈对我们至关重要</h3>
        <p className="text-sm text-gray-500">
          感谢您抽出宝贵时间提供意见，帮助我们不断改进产品体验。
        </p>
      </div>
      
      {/* 满意度评分 */}
      <div className="space-y-3">
        <Label className="block text-sm font-medium">您对于规划的整体满意度如何? (1-10分)</Label>
        <div className="flex flex-col sm:flex-row items-center gap-2">
          <div className="flex w-full justify-between items-center">
            <span className="text-xs sm:text-sm text-gray-500 mr-2">不满意</span>
            <div className="grid grid-cols-5 sm:flex sm:flex-row gap-1 sm:gap-2 justify-between flex-1">
              {Array.from({ length: 10 }, (_, i) => i + 1).map((score) => (
                <Button
                  key={score}
                  type="button"
                  variant={satisfaction === score ? 'default' : 'outline'}
                  size="sm"
                  className={`w-8 h-8 p-0 text-xs ${
                    satisfaction === score ? 'bg-pink-600 hover:bg-pink-700' : ''
                  }`}
                  onClick={() => setSatisfaction(score)}
                >
                  {score}
                </Button>
              ))}
            </div>
            <span className="text-xs sm:text-sm text-gray-500 ml-2">非常满意</span>
          </div>
        </div>
      </div>
      
      {/* 优化建议 */}
      <div className="space-y-2">
        <Label htmlFor="suggestion" className="block text-sm font-medium">您有哪些优化建议?</Label>
        <Textarea
          id="suggestion"
          placeholder="请分享您的想法和建议..."
          value={suggestion}
          onChange={(e) => setSuggestion(e.target.value)}
          rows={3}
          className="resize-none w-full"
        />
      </div>
      
      {/* 联系方式 */}
      <div className="space-y-1">
        <div className="flex items-start gap-3">
          <Checkbox
            id="willContact"
            className="mt-1"
            checked={willContact}
            onCheckedChange={(checked) => setWillContact(checked === true)}
          />
          <div>
            <Label htmlFor="willContact" className="text-sm font-normal leading-tight">
              是否愿意留下联系方式？产品小姐姐会在近期适时的和您进行沟通(大约1-5分钟)
            </Label>
            <p className="text-xs text-gray-500 mt-1">我们十分珍视您的宝贵建议!</p>
          </div>
        </div>
      </div>
      
      {/* 联系电话（条件显示） */}
      {willContact && (
        <div className="space-y-2">
          <Label htmlFor="contactPhone" className="block text-sm font-medium">联系电话</Label>
          <Input
            id="contactPhone"
            type="tel"
            placeholder="请输入您的手机号码"
            value={contactPhone}
            onChange={(e) => setContactPhone(e.target.value)}
            className="w-full"
          />
        </div>
      )}
      
      {/* 按钮组 */}
      <div className="flex justify-end gap-3 pt-3">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={isSubmitting}
          size="sm"
          className="px-4 py-2 h-auto"
        >
          取消
        </Button>
        <Button 
          type="submit" 
          disabled={isSubmitting} 
          className="bg-pink-600 hover:bg-pink-700 px-4 py-2 h-auto"
          size="sm"
        >
          {isSubmitting ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              提交中...
            </span>
          ) : (
            '提交反馈'
          )}
        </Button>
      </div>
    </form>
  );
} 