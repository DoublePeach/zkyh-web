/**
 * @description 知识点管理页面
 * @author 郝桃桃
 * @date 2024-05-25
 */
import { Suspense } from 'react';
import KnowledgePointsContent from './KnowledgePointsContent';

export default function KnowledgePointsPage() {
  return (
    <Suspense fallback={<div>加载中...</div>}>
      <KnowledgePointsContent />
    </Suspense>
  );
} 