"use client";

/**
 * @description 试卷列表表格组件
 * @author 郝桃桃
 * @date 2024-05-27
 */
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MoreHorizontal, Trash2, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { toast } from 'sonner';

// Define the expected shape of an exam paper item
interface ExamPaperItem {
  id: number;
  title: string;
  description?: string | null;
  status?: string | null; // 'draft', 'published', 'archived'
  subjectName?: string | null;
  createdAt: string; // Assuming ISO string format from API
  updatedAt: string;
}

async function fetchExamPapers(): Promise<ExamPaperItem[]> {
  const response = await fetch('/api/admin/exam-papers');
  if (!response.ok) {
    throw new Error('Failed to fetch exam papers');
  }
  const result = await response.json();
  if (!result.success) {
    throw new Error(result.error || 'Failed to fetch exam papers');
  }
  return result.data || [];
}

async function deleteExamPaper(id: number): Promise<void> {
    const response = await fetch(`/api/admin/exam-papers/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({})); // Catch potential JSON parsing errors
      throw new Error(errorData.error || 'Failed to delete exam paper');
    }
    // Check for 204 No Content as well
    if (response.status !== 204) {
        const result = await response.json();
        if (!result.success) {
            throw new Error(result.error || result.message || 'Failed to delete exam paper');
        }
    }
  }

export default function ExamPapersTable() {
  const [papers, setPapers] = useState<ExamPaperItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    setIsLoading(true);
    fetchExamPapers()
      .then(data => {
        setPapers(data);
        setError(null);
      })
      .catch(err => {
        console.error("Error fetching exam papers:", err);
        setError(err.message || '加载试卷列表时出错');
        toast.error("加载失败", { description: err.message || '加载试卷列表时出错' });
      })
      .finally(() => setIsLoading(false));
  }, []);

  const handleDelete = async (id: number) => {
    if (!window.confirm(`确定要删除 ID 为 ${id} 的试卷吗？此操作不可撤销。`)) {
      return;
    }
    try {
      await deleteExamPaper(id);
      setPapers(prevPapers => prevPapers.filter(p => p.id !== id));
      toast.success("删除成功", { description: `试卷 ID: ${id} 已被删除` });
    } catch (err: unknown) {
      console.error("Error deleting exam paper:", err);
      const message = err instanceof Error ? err.message : "未知错误";
      toast.error("删除失败", { description: message });
    }
  };

  // Helper to format date
  const formatDate = (dateString: string) => {
    try {
        return new Date(dateString).toLocaleString('zh-CN', { dateStyle: 'short', timeStyle: 'short' });
    } catch {
        return dateString; // Return original if parsing fails
    }
  };

  // Helper to get status badge variant
  const getStatusVariant = (status: string | null | undefined): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'published':
        return 'default'; // Green or primary color
      case 'draft':
        return 'secondary'; // Gray
      case 'archived':
        return 'outline'; // Outline or different color
      default:
        return 'secondary';
    }
  };

  if (isLoading) {
    return <div className="text-center py-10">加载中...</div>;
  }

  if (error) {
    return <div className="text-center py-10 text-red-600">错误: {error}</div>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>ID</TableHead>
          <TableHead>标题</TableHead>
          <TableHead>所属科目</TableHead>
          <TableHead>状态</TableHead>
          <TableHead>创建时间</TableHead>
          <TableHead>更新时间</TableHead>
          <TableHead className="text-right">操作</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {papers.length > 0 ? (
          papers.map((paper) => (
            <TableRow key={paper.id}>
              <TableCell className="font-medium">{paper.id}</TableCell>
              <TableCell>{paper.title}</TableCell>
              <TableCell>{paper.subjectName || '-'}</TableCell>
              <TableCell>
                <Badge variant={getStatusVariant(paper.status)}>{paper.status || '未知'}</Badge>
              </TableCell>
              <TableCell>{formatDate(paper.createdAt)}</TableCell>
              <TableCell>{formatDate(paper.updatedAt)}</TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">打开菜单</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>操作</DropdownMenuLabel>
                    <DropdownMenuItem
                      onClick={() => router.push(`/admin/exam-papers/edit/${paper.id}`)}
                    >
                       <Edit className="mr-2 h-4 w-4" /> 编辑
                    </DropdownMenuItem>
                    {/* Add other actions like View, Duplicate etc. if needed */}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-red-600"
                      onClick={() => handleDelete(paper.id)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" /> 删除
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell colSpan={7} className="h-24 text-center">
              暂无试卷数据。
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
} 