/**
 * @description 编辑考试科目页面 (Server Component Shell)
 * @author 郝桃桃
 * @date 2024-05-24
 */
import EditExamSubjectClient from './components/EditExamSubjectClient';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

interface EditExamSubjectPageProps {
  params: { id: string };
}

// Make it async to handle params correctly
export default async function EditExamSubjectPage({ params }: EditExamSubjectPageProps) {
    const resolvedParams = await params;
    const subjectId = resolvedParams.id; // Keep as string or parse if needed by header

    // Basic validation (can be improved)
    if (!subjectId || isNaN(parseInt(subjectId))){
         return <div>无效的科目 ID</div>;
    }

  return (
    <div className="space-y-6">
        {/* Keep the header/navigation part in the server component */}
        <div className="flex items-center justify-between mb-6">
             <div>
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" asChild className="h-8 w-8">
                        <Link href="/admin/exam-subjects">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <h1 className="text-xl font-bold tracking-tight">编辑考试科目</h1>
                </div>
                 <p className="text-muted-foreground text-sm mt-2 ml-10">
                    编辑现有考试科目的信息。
                </p>
            </div>
            {/* <Link
            href="/admin/exam-subjects"
            className="text-sm text-muted-foreground hover:text-foreground"
            >
            返回科目列表
            </Link> */} { /* Button is included in the form now */}
        </div>
        
        {/* Render the client component for the form */}
        <EditExamSubjectClient id={subjectId} />
    </div>
  );
} 