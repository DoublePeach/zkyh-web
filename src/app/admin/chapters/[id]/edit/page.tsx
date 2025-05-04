/**
 * @description 编辑章节页面 (Server Component Shell)
 * @author 郝桃桃
 * @date 2024-05-24
 */
import EditChapterClient from './components/EditChapterClient';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

// Remove the separate interface
// interface EditChapterPageProps {
//   params: { id: string };
// }

// Use inline type for props, defining params as a Promise
export default async function EditChapterPage({ params }: { params: Promise<{ id: string }> }) {
    // Await the params Promise to get the actual object
    const actualParams = await params; 
    const chapterId = actualParams.id;

    if (!chapterId || isNaN(parseInt(chapterId))){
         return <div>无效的章节 ID</div>;
    }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div>
            <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" asChild className="h-8 w-8">
                    <Link href="/admin/chapters">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <h1 className="text-xl font-bold tracking-tight">编辑章节</h1>
            </div>
                <p className="text-muted-foreground text-sm mt-2 ml-10">
                编辑现有章节的信息。
            </p>
        </div>
         <Link
          href="/admin/chapters"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          返回列表
        </Link>
      </div>
        
        <EditChapterClient id={chapterId} />
    </div>
  );
} 