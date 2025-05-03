/**
 * @description 题库试题管理页面
 * @author 郝桃桃
 * @date 2024-05-26
 */

import QuizQuestionsClient from "./components/QuizQuestionsClient";

// 服务器组件作为入口点
export default function QuizQuestionsPage({ params }: { params: { id: string } }) {
  return <QuizQuestionsClient id={params.id} />;
} 