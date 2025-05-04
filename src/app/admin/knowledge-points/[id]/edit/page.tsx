/**
 * @description 编辑知识点页面 (Server Component Shell)
 * @author 郝桃桃
 * @date 2024-05-25
 */
import EditKnowledgePointClient from './components/EditKnowledgePointClient';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

interface EditKnowledgePointPageProps {
  params: { id: string };
}

// Make it async to handle params correctly
export default async function EditKnowledgePointPage({ params }: EditKnowledgePointPageProps) {
    const resolvedParams = await params;
    const knowledgePointId = resolvedParams.id;

    if (!knowledgePointId || isNaN(parseInt(knowledgePointId))){
         return <div>无效的知识点 ID</div>;
    }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
         <div>
            <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" asChild className="h-8 w-8">
                    <Link href="/admin/knowledge-points">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <h1 className="text-xl font-bold tracking-tight">编辑知识点</h1>
            </div>
                <p className="text-muted-foreground text-sm mt-2 ml-10">
                编辑现有知识点的信息。
            </p>
        </div>
        <Link
          href="/admin/knowledge-points"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          返回列表
        </Link>
      </div>
        
        <EditKnowledgePointClient id={knowledgePointId} />
    </div>
  );
} 