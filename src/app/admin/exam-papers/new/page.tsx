/**
 * @description 新建试卷页面
 * @author 郝桃桃
 * @date 2024-05-27
 */
import ExamPaperForm from '../components/ExamPaperForm';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

// Server component
export default function NewExamPaperPage() {
  return (
    <div className="space-y-6">
        <div>
             <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" asChild className="h-8 w-8">
                <Link href="/admin/exam-papers">
                    <ArrowLeft className="h-4 w-4" />
                </Link>
                </Button>
                <h1 className="text-xl font-bold tracking-tight">新建试卷</h1>
            </div>
             <p className="text-muted-foreground text-sm mt-2">
                创建一个新的考试试卷并配置题目。
            </p>
        </div>
      <ExamPaperForm /> {/* Render the form without paperId */}
    </div>
  );
} 