'use client';

/**
 * @description 管理员用户反馈列表页面
 * @author 郝桃桃
 * @date 2024-05-10
 */

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationNext, 
  PaginationPrevious 
} from '@/components/ui/pagination';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { toast } from 'sonner';

// 定义反馈状态及其颜色
const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200',
  in_progress: 'bg-blue-100 text-blue-800 hover:bg-blue-200',
  completed: 'bg-green-100 text-green-800 hover:bg-green-200',
  ignored: 'bg-gray-100 text-gray-800 hover:bg-gray-200',
};

// 反馈状态选项
const STATUS_OPTIONS = [
  { value: '', label: '全部状态' },
  { value: 'pending', label: '待处理' },
  { value: 'in_progress', label: '处理中' },
  { value: 'completed', label: '已完成' },
  { value: 'ignored', label: '已忽略' },
];

function FeedbacksContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // 解析查询参数
  const currentPage = Number(searchParams.get('page') || '1');
  const currentStatus = searchParams.get('status') || '';
  
  // 状态
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  
  // 分页配置
  const pageSize = 10;
  
  // 获取反馈列表
  const fetchFeedbacks = async (page: number, status: string) => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      queryParams.set('page', page.toString());
      queryParams.set('pageSize', pageSize.toString());
      
      if (status) {
        queryParams.set('status', status);
      }
      
      const response = await fetch(`/api/feedbacks?${queryParams.toString()}`);
      
      if (!response.ok) {
        throw new Error('获取反馈列表失败');
      }
      
      const result = await response.json();
      
      if (result.success) {
        setFeedbacks(result.data.items);
        setTotalPages(result.data.totalPages);
        setTotalItems(result.data.total);
      } else {
        throw new Error(result.error || '获取反馈列表失败');
      }
    } catch (error: any) {
      console.error('获取反馈列表失败:', error);
      toast.error(error.message || '获取反馈列表失败，请稍后再试');
    } finally {
      setLoading(false);
    }
  };
  
  // 处理分页变化
  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', page.toString());
    router.push(`/admin/feedbacks?${params.toString()}`);
  };
  
  // 处理状态过滤变化
  const handleStatusChange = (status: string) => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (status) {
      params.set('status', status);
    } else {
      params.delete('status');
    }
    
    // 重置到第一页
    params.set('page', '1');
    
    router.push(`/admin/feedbacks?${params.toString()}`);
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
    }).format(date);
  };
  
  // 获取状态显示文本
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return '待处理';
      case 'in_progress': return '处理中';
      case 'completed': return '已完成';
      case 'ignored': return '已忽略';
      default: return '未知状态';
    }
  };
  
  // 获取状态对应的样式类
  const getStatusClass = (status: string) => {
    return STATUS_COLORS[status as keyof typeof STATUS_COLORS] || 'bg-gray-100 text-gray-800';
  };
  
  // 当页码或状态过滤发生变化时获取数据
  useEffect(() => {
    fetchFeedbacks(currentPage, currentStatus);
  }, [currentPage, currentStatus]);
  
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center mb-8">
        <Link href="/admin/dashboard" className="flex items-center text-gray-600 hover:text-gray-900 mr-4">
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold">用户反馈管理</h1>
      </div>
      
      {/* 筛选和统计 */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">状态:</span>
            <Select
              value={currentStatus}
              onValueChange={handleStatusChange}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="全部状态" />
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
          
          <div className="text-sm text-gray-500">
            共 <span className="font-medium">{totalItems}</span> 条反馈
          </div>
        </div>
      </div>
      
      {/* 反馈列表 */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="py-20 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-500">加载中...</p>
          </div>
        ) : feedbacks.length > 0 ? (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">ID</TableHead>
                  <TableHead className="w-[100px]">满意度</TableHead>
                  <TableHead>反馈内容</TableHead>
                  <TableHead className="w-[120px]">来源</TableHead>
                  <TableHead className="w-[120px]">联系电话</TableHead>
                  <TableHead className="w-[120px]">状态</TableHead>
                  <TableHead className="w-[180px]">提交时间</TableHead>
                  <TableHead className="w-[120px] text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {feedbacks.map((feedback) => (
                  <TableRow key={feedback.id}>
                    <TableCell className="font-medium">{feedback.id}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded ${
                        feedback.satisfaction >= 8 ? 'bg-green-100 text-green-800' :
                        feedback.satisfaction >= 6 ? 'bg-blue-100 text-blue-800' :
                        feedback.satisfaction >= 4 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {feedback.satisfaction} 分
                      </span>
                    </TableCell>
                    <TableCell className="max-w-[300px] truncate">
                      {feedback.suggestion || <span className="text-gray-400">- 无内容 -</span>}
                    </TableCell>
                    <TableCell>
                      {(() => {
                        const sourceMap = {
                          'study_plans': '备考规划',
                          'home': '首页',
                          'study_detail': '学习详情',
                          'profile': '个人中心'
                        };
                        return sourceMap[feedback.source as keyof typeof sourceMap] || feedback.source;
                      })()}
                    </TableCell>
                    <TableCell>
                      {feedback.willContact && feedback.contactPhone ? (
                        <span className="text-blue-600">{feedback.contactPhone}</span>
                      ) : (
                        <span className="text-gray-400">- 未留电话 -</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusClass(feedback.status)}>
                        {getStatusLabel(feedback.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(feedback.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      <Link href={`/admin/feedbacks/${feedback.id}`}>
                        <Button variant="outline" size="sm">
                          查看详情
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            
            {/* 分页 */}
            {totalPages > 1 && (
              <div className="py-4 border-t">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious 
                        href="#" 
                        onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
                          e.preventDefault();
                          if (currentPage > 1) handlePageChange(currentPage - 1);
                        }}
                        className={currentPage <= 1 ? 'pointer-events-none opacity-50' : ''}
                      />
                    </PaginationItem>
                    
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <PaginationItem key={page}>
                        <Button
                          variant={page === currentPage ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => handlePageChange(page)}
                          className={`w-9 h-9 p-0 ${
                            page === currentPage ? 'bg-primary text-primary-foreground' : ''
                          }`}
                        >
                          {page}
                        </Button>
                      </PaginationItem>
                    ))}
                    
                    <PaginationItem>
                      <PaginationNext 
                        href="#" 
                        onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
                          e.preventDefault();
                          if (currentPage < totalPages) handlePageChange(currentPage + 1);
                        }}
                        className={currentPage >= totalPages ? 'pointer-events-none opacity-50' : ''}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </>
        ) : (
          <div className="py-20 text-center">
            <p className="text-gray-500">暂无反馈数据</p>
          </div>
        )}
      </div>
    </div>
  );
}

// 使用Suspense包装主组件
export default function AdminFeedbacksPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto py-8 px-4">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      </div>
    }>
      <FeedbacksContent />
    </Suspense>
  );
} 