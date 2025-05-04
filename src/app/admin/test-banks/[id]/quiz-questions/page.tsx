/**
 * @description 题库试题管理页面
 * @author 郝桃桃
 * @date 2024-05-26
 */

import QuizQuestionsClient from "./components/QuizQuestionsClient";

// 服务器组件作为入口点，使用 Promise 类型定义
export default async function QuizQuestionsPage({ params }: { params: Promise<{ id: string }> }) {
  // Await params before accessing properties
  const actualParams = await params;
  return <QuizQuestionsClient id={actualParams.id} />;
} 