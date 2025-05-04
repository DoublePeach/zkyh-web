/**
 * @description 编辑题库页面 (Server Component Shell)
 * @author 郝桃桃
 * @date 2024-05-25
 */
import EditTestBankClient from "./components/EditTestBankClient";
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

// 删除单独的接口定义
// interface EditTestBankPageProps {
//   params: { id: string };
// }

// 使用内联类型，将params定义为Promise
export default async function EditTestBankPage({ params }: { params: Promise<{ id: string }> }) {
    const actualParams = await params;
    const bankId = actualParams.id;

    if (!bankId || isNaN(parseInt(bankId))){
         return <div>无效的题库 ID</div>;
    }

  return (
    <div className="space-y-6">
       {/* Header section */}
        <div>
            <div className="flex items-center gap-2">
                <Button
                    variant="ghost"
                    size="icon"
                    asChild
                    className="h-8 w-8"
                >
                    <Link href="/admin/test-banks">
                    <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <h1 className="text-xl font-bold tracking-tight">编辑题库</h1>
            </div>
            <p className="text-muted-foreground text-sm mt-2 ml-10">
                编辑现有题库信息。
            </p>
        </div>
        
        {/* Client component for the form */}
        <EditTestBankClient id={bankId} />
    </div>
  );
} 