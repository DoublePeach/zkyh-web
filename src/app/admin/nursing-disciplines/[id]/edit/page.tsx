/**
 * @description 编辑护理学科页面 (Server Component Shell)
 * @author 郝桃桃
 * @date 2024-05-24
 */
import EditNursingDisciplineClient from './components/EditNursingDisciplineClient';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

interface EditNursingDisciplinePageProps {
  params: { id: string };
}

// Make it async to handle params correctly
export default async function EditNursingDisciplinePage({ params }: EditNursingDisciplinePageProps) {
    const resolvedParams = await params;
    const disciplineId = resolvedParams.id;

    if (!disciplineId || isNaN(parseInt(disciplineId))){
         return <div>无效的学科 ID</div>;
    }

  return (
    <div className="space-y-6">
        <div className="flex items-center justify-between mb-6">
            <div>
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" asChild className="h-8 w-8">
                        <Link href="/admin/nursing-disciplines">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <h1 className="text-xl font-bold tracking-tight">编辑护理学科</h1>
                </div>
                    <p className="text-muted-foreground text-sm mt-2 ml-10">
                    编辑现有护理学科的信息。
                </p>
            </div>
            {/* Link back to list */}
            <Link
            href="/admin/nursing-disciplines"
            className="text-sm text-muted-foreground hover:text-foreground"
            >
             返回列表
            </Link>
        </div>
        
        <EditNursingDisciplineClient id={disciplineId} />
    </div>
  );
} 