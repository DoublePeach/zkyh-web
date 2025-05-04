/**
 * @description 编辑试卷页面
 * @author 郝桃桃
 * @date 2024-05-27
 */
import ExamPaperForm from '../../components/ExamPaperForm'; // Adjust path
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

interface EditExamPaperPageProps {
  params: { id: string };
}

// Server component - Make it async to handle params
export default async function EditExamPaperPage({ params }: EditExamPaperPageProps) {
  // Await params here (even though we just pass the id)
  // This adheres to Next.js 15+ best practices
  const resolvedParams = await params; 
  const paperId = parseInt(resolvedParams.id);

  if (isNaN(paperId)) {
    // Handle invalid ID, maybe redirect or show an error component
    return <div>无效的试卷 ID</div>;
  }

  // We could fetch initialData here and pass it down, 
  // but the form component currently fetches its own data.
  // Passing the ID is sufficient for the form to know it's in edit mode.

  return (
     <div className="space-y-6">
        <div>
             <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" asChild className="h-8 w-8">
                <Link href="/admin/exam-papers">
                    <ArrowLeft className="h-4 w-4" />
                </Link>
                </Button>
                <h1 className="text-xl font-bold tracking-tight">编辑试卷 (ID: {paperId})</h1>
            </div>
             <p className="text-muted-foreground text-sm mt-2">
                修改现有试卷的信息和题目配置。
            </p>
        </div>
      <ExamPaperForm paperId={paperId} /> {/* Pass the paperId */}
    </div>
  );
} 