/**
 * @description 添加试题页面
 * @author 郝桃桃
 * @date 2024-05-26
 */

import NewQuizQuestionClient from "../components/NewQuizQuestionClient";

// 服务器组件作为入口点，使用 Promise 类型定义
export default async function NewQuizQuestionPage({ params }: { params: Promise<{ id: string }> }) {
  // Await params before accessing properties
  const actualParams = await params;
  return <NewQuizQuestionClient id={actualParams.id} />;
} 