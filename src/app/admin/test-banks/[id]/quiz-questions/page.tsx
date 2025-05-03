/**
 * @description 题库试题管理页面
 * @author 郝桃桃
 * @date 2024-05-26
 */

import QuizQuestionsClient from "./components/QuizQuestionsClient";

// 服务器组件作为入口点，修改为 async 并 await params
export default async function QuizQuestionsPage({ params }: { params: { id: string } }) {
  // Await params before accessing properties
  const resolvedParams = await params;
  return <QuizQuestionsClient id={resolvedParams.id} />;
} 