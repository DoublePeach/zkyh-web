'use client';

/**
 * @description 用户反馈详情页面
 * @author 郝桃桃
 * @date 2024-05-10
 */

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ChevronLeft, User, Phone, Calendar, MessageCircle, Star } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

// 反馈状态选项
const STATUS_OPTIONS = [
  { value: 'pending', label: '待处理' },
  { value: 'in_progress', label: '处理中' },
  { value: 'completed', label: '已完成' },
  { value: 'ignored', label: '已忽略' },
];

// 反馈来源显示文本
const SOURCE_LABELS: Record<string, string> = {
  'study_plans': '备考规划',
  'home': '首页',
  'study_detail': '学习详情',
  'profile': '个人中心'
};

// 定义反馈状态及其颜色
const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200',
  in_progress: 'bg-blue-100 text-blue-800 hover:bg-blue-200',
  completed: 'bg-green-100 text-green-800 hover:bg-green-200',
  ignored: 'bg-gray-100 text-gray-800 hover:bg-gray-200',
};

export default function FeedbackDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  
  const [feedback, setFeedback] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string>('');
  const [adminNotes, setAdminNotes] = useState<string>('');
  
  // 获取反馈详情
  const fetchFeedbackDetail = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/feedbacks/${id}`);
      
      if (!response.ok) {
        throw new Error('获取反馈详情失败');
      }
      
      const result = await response.json();
      
      if (result.success) {
        setFeedback(result.data);
        setStatus(result.data.status);
        setAdminNotes(result.data.adminNotes || '');
      } else {
        throw new Error(result.error || '获取反馈详情失败');
      }
    } catch (error: any) {
      console.error('获取反馈详情失败:', error);
      toast.error(error.message || '获取反馈详情失败，请稍后再试');
    } finally {
      setLoading(false);
    }
  };
  
  // 更新反馈状态
  const updateFeedbackStatus = async () => {
    try {
      setSaving(true);
      
      const response = await fetch(`/api/feedbacks/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status,
          adminNotes,
        }),
      });
      
      if (!response.ok) {
        throw new Error('更新反馈状态失败');
      }
      
      const result = await response.json();
      
      if (result.success) {
        toast.success('反馈状态已更新');
      } else {
        throw new Error(result.error || '更新反馈状态失败');
      }
    } catch (error: any) {
      console.error('更新反馈状态失败:', error);
      toast.error(error.message || '更新反馈状态失败，请稍后再试');
    } finally {
      setSaving(false);
    }
  };
  
  // 获取状态对应的样式类
  const getStatusClass = (statusValue: string) => {
    return STATUS_COLORS[statusValue] || 'bg-gray-100 text-gray-800';
  };
  
  // 获取状态文本
  const getStatusLabel = (statusValue: string) => {
    const option = STATUS_OPTIONS.find(opt => opt.value === statusValue);
    return option ? option.label : '未知状态';
  };
  
  // 格式化时间
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(date);
  };
  
  // 获取满意度评价文本
  const getSatisfactionText = (score: number) => {
    if (score >= 9) return '非常满意';
    if (score >= 7) return '满意';
    if (score >= 5) return '一般';
    if (score >= 3) return '不满意';
    return '非常不满意';
  };
  
  // 获取满意度评价颜色
  const getSatisfactionColor = (score: number) => {
    if (score >= 9) return 'text-green-600';
    if (score >= 7) return 'text-blue-600';
    if (score >= 5) return 'text-yellow-600';
    if (score >= 3) return 'text-orange-600';
    return 'text-red-600';
  };
  
  // 初始化加载
  useEffect(() => {
    if (id) {
      fetchFeedbackDetail();
    }
  }, [id]);
  
  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      </div>
    );
  }
  
  if (!feedback) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex justify-center items-center h-64">
          <p className="text-gray-500">反馈不存在或已被删除</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center mb-6">
        <Link href="/admin/feedbacks" className="flex items-center text-gray-600 hover:text-gray-900 mr-4">
          <ChevronLeft className="h-5 w-5" />
          返回列表
        </Link>
        <h1 className="text-2xl font-bold">反馈详情</h1>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 反馈信息 */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>反馈内容</span>
                <Badge className={getStatusClass(feedback.status)}>
                  {getStatusLabel(feedback.status)}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 满意度 */}
              <div className="space-y-2">
                <div className="text-sm font-medium text-gray-500">满意度评分</div>
                <div className="flex items-center gap-2">
                  <div className={`text-2xl font-bold ${getSatisfactionColor(feedback.satisfaction)}`}>
                    {feedback.satisfaction}
                  </div>
                  <div className="text-sm text-gray-500">/10</div>
                  <div className="ml-2 flex items-center">
                    {[...Array(10)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < feedback.satisfaction
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <div className={`ml-2 text-sm ${getSatisfactionColor(feedback.satisfaction)}`}>
                    {getSatisfactionText(feedback.satisfaction)}
                  </div>
                </div>
              </div>
              
              {/* 反馈建议 */}
              <div className="space-y-2">
                <div className="text-sm font-medium text-gray-500">反馈建议</div>
                <div className="p-4 bg-gray-50 rounded-md min-h-[100px]">
                  {feedback.suggestion ? (
                    <p className="whitespace-pre-line">{feedback.suggestion}</p>
                  ) : (
                    <p className="text-gray-400 italic">用户未提供建议内容</p>
                  )}
                </div>
              </div>
              
              {/* 联系意愿 */}
              <div className="space-y-2">
                <div className="text-sm font-medium text-gray-500">联系意愿</div>
                <div className="flex items-center">
                  <Badge variant={feedback.willContact ? 'default' : 'outline'} className="mr-2">
                    {feedback.willContact ? '愿意被联系' : '不愿意被联系'}
                  </Badge>
                  {feedback.willContact && feedback.contactPhone && (
                    <div className="flex items-center text-blue-600">
                      <Phone className="h-4 w-4 mr-1" />
                      {feedback.contactPhone}
                    </div>
                  )}
                </div>
              </div>
              
              {/* 来源和时间信息 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="text-sm font-medium text-gray-500">反馈来源</div>
                  <div className="flex items-center">
                    <MessageCircle className="h-4 w-4 mr-2 text-gray-400" />
                    <span>{SOURCE_LABELS[feedback.source] || feedback.source}</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm font-medium text-gray-500">提交时间</div>
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                    <span>{formatDate(feedback.createdAt)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* 管理操作区域 */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>处理信息</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 反馈ID */}
              <div className="space-y-1">
                <div className="text-sm font-medium text-gray-500">反馈ID</div>
                <div className="font-mono bg-gray-100 p-2 rounded text-sm">
                  {feedback.id}
                </div>
              </div>
              
              {/* 用户信息 */}
              <div className="space-y-1">
                <div className="text-sm font-medium text-gray-500">用户ID</div>
                <div className="flex items-center">
                  <User className="h-4 w-4 mr-2 text-gray-400" />
                  <span className="font-mono">{feedback.userId}</span>
                </div>
              </div>
              
              {/* 处理状态 */}
              <div className="space-y-2">
                <Label htmlFor="status">处理状态</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger id="status">
                    <SelectValue placeholder="选择状态" />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* 管理员备注 */}
              <div className="space-y-2">
                <Label htmlFor="adminNotes">处理备注</Label>
                <Textarea
                  id="adminNotes"
                  placeholder="添加处理备注..."
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows={5}
                />
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button
                className="w-full"
                onClick={updateFeedbackStatus}
                disabled={saving}
              >
                {saving ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    保存中...
                  </span>
                ) : (
                  '保存更改'
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
} 