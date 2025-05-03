/**
 * @description 添加试题页面
 * @author 郝桃桃
 * @date 2024-05-26
 */

import NewQuizQuestionClient from "../components/NewQuizQuestionClient";

// 服务器组件作为入口点，修改为 async 并 await params
export default async function NewQuizQuestionPage({ params }: { params: { id: string } }) {
  // Await params before accessing properties
  const resolvedParams = await params;
  return <NewQuizQuestionClient id={resolvedParams.id} />;
} 