/**
 * @description 试卷管理列表页面
 * @author 郝桃桃
 * @date 2024-05-27
 */
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ExamPapersTable from './components/ExamPapersTable'; // We'll create this next

// This is a Server Component by default
export default function ExamPapersPage() {
  // Data fetching will happen inside the ExamPapersTable (Client Component)
  // or we could fetch here and pass down if needed.

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">试卷管理</h1>
        <Button asChild>
          <Link href="/admin/exam-papers/new">
            <Plus className="mr-2 h-4 w-4" /> 新建试卷
          </Link>
        </Button>
      </div>

      {/* We pass necessary props or let the table fetch data itself */}
      <ExamPapersTable /> 
    </div>
  );
} 