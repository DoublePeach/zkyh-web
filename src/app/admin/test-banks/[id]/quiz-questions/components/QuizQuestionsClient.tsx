"use client";

/**
 * @description 题库试题管理客户端组件
 * @author 郝桃桃
 * @date 2024-05-26
 */

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, Search, Filter, MoreHorizontal, Trash2, Edit, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getTestBank } from "@/lib/services/test-bank-service";
import { getQuizQuestionsByTestBank, deleteQuizQuestion, QuizQuestion } from "@/lib/services/quiz-question-service";
import { toast } from "sonner";
import { TestBank } from "@/lib/services/test-bank-service";

export default function QuizQuestionsClient({ id }: { id: string }) {
  const [testBank, setTestBank] = useState<TestBank | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [filteredQuestions, setFilteredQuestions] = useState<QuizQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState("all");
  const router = useRouter();

  // 题型列表
  const questionTypes = [
    { id: "单选题", name: "单选题" },
    { id: "多选题", name: "多选题" },
    { id: "判断题", name: "判断题" },
    { id: "简答题", name: "简答题" },
    { id: "案例分析题", name: "案例分析题" },
  ];

  // 难度级别
  const difficultyLevels = [
    { id: "1", name: "简单" },
    { id: "2", name: "较简单" },
    { id: "3", name: "中等" },
    { id: "4", name: "较难" },
    { id: "5", name: "困难" },
  ];

  // 获取题库信息和试题列表
  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true);
        
        // 获取题库详情
        const bankId = parseInt(id);
        if (isNaN(bankId)) {
          toast.error("无效的题库ID");
          router.push("/admin/test-banks");
          return;
        }
        
        // 获取题库信息
        const testBankResult = await getTestBank(bankId);
        if (!testBankResult.success) {
          toast.error("获取题库失败", {
            description: testBankResult.message,
          });
          router.push("/admin/test-banks");
          return;
        }
        
        setTestBank(testBankResult.data ?? null);
        
        // 获取题库下的试题
        const questionsResult = await getQuizQuestionsByTestBank(bankId);
        if (questionsResult.success) {
          setQuestions(questionsResult.data || []);
          setFilteredQuestions(questionsResult.data || []);
        } else {
          toast.error("获取试题列表失败", {
            description: questionsResult.message,
          });
        }
      } catch (error: unknown) {
        console.error("获取数据出错:", error);
        const message = error instanceof Error ? error.message : "未知错误";
        toast.error("出错了", {
          description: message || "获取数据时发生错误",
        });
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [id, router]);

  // 筛选试题
  useEffect(() => {
    if (!questions.length) return;
    
    let filtered = [...questions];
    
    // 按题型筛选
    if (selectedType !== "all") {
      filtered = filtered.filter(q => q.questionType === selectedType);
    }
    
    // 按难度筛选
    if (selectedDifficulty !== "all") {
      filtered = filtered.filter(q => q.difficulty === parseInt(selectedDifficulty));
    }
    
    // 按搜索词筛选
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(q => 
        q.content.toLowerCase().includes(term) || 
        q.explanation.toLowerCase().includes(term) ||
        (q.knowledgePointTitle && q.knowledgePointTitle.toLowerCase().includes(term))
      );
    }
    
    setFilteredQuestions(filtered);
  }, [questions, selectedType, selectedDifficulty, searchTerm]);

  // 重置筛选条件
  function resetFilters() {
    setSearchTerm("");
    setSelectedType("all");
    setSelectedDifficulty("all");
  }

  // 删除试题
  async function handleDeleteQuestion(question: QuizQuestion) {
    if (window.confirm(`确定要删除此试题吗？`)) {
      try {
        const result = await deleteQuizQuestion(question.id);
        
        if (result.success) {
          toast.success("删除成功", {
            description: "试题已成功删除",
          });
          
          // 更新试题列表
          setQuestions(prev => prev.filter(q => q.id !== question.id));
          
          // 更新题库数量显示
          if (testBank) {
            setTestBank({
              ...testBank,
              totalQuestions: testBank.totalQuestions - 1
            });
          }
        } else {
          toast.error("删除失败", {
            description: result.message || "未能删除试题",
          });
        }
      } catch (error: unknown) {
        console.error("删除试题失败:", error);
        const message = error instanceof Error ? error.message : "未知错误";
        toast.error("删除出错", {
          description: message || "删除试题时出现错误，请稍后重试",
        });
      }
    }
  }

  // 获取难度对应的颜色和文本
  function getDifficultyInfo(level: number) {
    switch (level) {
      case 1:
        return { color: "bg-green-100 text-green-800", text: "简单" };
      case 2:
        return { color: "bg-blue-100 text-blue-800", text: "较简单" };
      case 3:
        return { color: "bg-orange-100 text-orange-800", text: "中等" };
      case 4:
        return { color: "bg-purple-100 text-purple-800", text: "较难" };
      case 5:
        return { color: "bg-red-100 text-red-800", text: "困难" };
      default:
        return { color: "bg-gray-100 text-gray-800", text: "未知" };
    }
  }

  // 获取题型对应的颜色
  function getQuestionTypeColor(type: string) {
    switch (type) {
      case "单选题":
        return "bg-blue-100 text-blue-800";
      case "多选题":
        return "bg-purple-100 text-purple-800";
      case "判断题":
        return "bg-green-100 text-green-800";
      case "简答题":
        return "bg-orange-100 text-orange-800";
      case "案例分析题":
        return "bg-amber-100 text-amber-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  }

  // 格式化显示的选项
  function formatOptions(options: unknown): { key: string; value: string }[] {
    if (!options) return [];
    
    try {
      if (typeof options === 'string') {
        const parsed = JSON.parse(options);
        if (Array.isArray(parsed)) {
            return parsed as { key: string; value: string }[];
        }
      }
      if (Array.isArray(options)) {
           return options as { key: string; value: string }[];
      }
      return [];
    } catch (e) {
      console.error("解析选项出错:", e);
      return [];
    }
  }

  // 渲染试题列表标签页
  function renderQuestionList() {
    if (isLoading) {
      return (
        <div className="py-10 text-center">
          <p className="text-muted-foreground">加载中...</p>
        </div>
      );
    }

    if (!filteredQuestions.length) {
      return (
        <div className="py-10 text-center">
          <p className="text-muted-foreground">
            {questions.length ? "没有找到匹配的试题" : "题库中暂无试题，请添加"}
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {filteredQuestions.map((question) => (
          <Card key={question.id} className="overflow-hidden">
            <CardHeader className="px-4 py-3 bg-muted/50">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                    <Badge className={getQuestionTypeColor(question.questionType)}>
                      {question.questionType}
                    </Badge>
                    <Badge className={getDifficultyInfo(question.difficulty).color}>
                      {getDifficultyInfo(question.difficulty).text}
                    </Badge>
                    {question.knowledgePointTitle && (
                      <span className="text-xs text-muted-foreground">
                        知识点: {question.knowledgePointTitle}
                      </span>
                    )}
                  </CardTitle>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>试题操作</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => router.push(`/admin/test-banks/${id}/quiz-questions/${question.id}`)}
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      <span>查看详情</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => router.push(`/admin/test-banks/${id}/quiz-questions/${question.id}/edit`)}
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      <span>编辑试题</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-red-600"
                      onClick={() => handleDeleteQuestion(question)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      <span>删除试题</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="text-sm sm:text-base">
                  <div dangerouslySetInnerHTML={{ __html: question.content }} />
                </div>
                
                {question.questionType !== "简答题" && question.questionType !== "案例分析题" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                    {formatOptions(question.options).map((option: { key: string; value: string }, index: number) => (
                      <div 
                        key={index} 
                        className={`text-xs sm:text-sm p-2 border rounded-md ${
                          question.correctAnswer.includes(option.key) ? 'border-green-500 bg-green-50' : 'border-gray-200'
                        }`}
                      >
                        <span className="font-medium">{option.key}.</span> {option.value}
                        {question.correctAnswer.includes(option.key) && (
                          <span className="ml-1 text-green-600">✓</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                
                {(question.questionType === "简答题" || question.questionType === "案例分析题") && (
                  <div className="mt-2 text-xs sm:text-sm">
                    <p className="font-medium">参考答案:</p>
                    <div className="mt-1 p-3 bg-gray-50 rounded-md">
                      {question.correctAnswer}
                    </div>
                  </div>
                )}
                
                <div className="mt-3 text-xs sm:text-sm">
                  <p className="font-medium text-muted-foreground">解析:</p>
                  <div className="mt-1 text-muted-foreground">
                    {question.explanation}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
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
          <div>
            <h1 className="text-xl font-bold tracking-tight">试题管理</h1>
            {testBank && (
              <p className="text-muted-foreground text-sm">
                {testBank.name} ({testBank.totalQuestions}题)
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:justify-between gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜索试题内容、解析或知识点..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button
          onClick={() => router.push(`/admin/test-banks/${id}/quiz-questions/new`)}
          className="sm:w-auto"
        >
          <Plus className="mr-2 h-4 w-4" /> 添加试题
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium">题目类型</label>
          <Select 
            value={selectedType} 
            onValueChange={setSelectedType}
            disabled={isLoading}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="选择题目类型" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部类型</SelectItem>
              {questionTypes.map((type) => (
                <SelectItem 
                  key={type.id} 
                  value={type.id}
                >
                  {type.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">难度级别</label>
          <Select 
            value={selectedDifficulty} 
            onValueChange={setSelectedDifficulty}
            disabled={isLoading}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="选择难度级别" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部难度</SelectItem>
              {difficultyLevels.map((level) => (
                <SelectItem 
                  key={level.id} 
                  value={level.id}
                >
                  {level.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex justify-end">
        <Button 
          variant="outline" 
          onClick={resetFilters}
          disabled={isLoading}
          className="w-full sm:w-auto"
        >
          <Filter className="mr-2 h-4 w-4" /> 重置筛选
        </Button>
      </div>

      <Tabs defaultValue="list" className="w-full">
        <TabsList className="w-full sm:w-auto grid grid-cols-2 sm:inline-flex">
          <TabsTrigger value="list">试题列表</TabsTrigger>
          <TabsTrigger value="stats">统计分析</TabsTrigger>
        </TabsList>
        <TabsContent value="list" className="mt-6">
          {renderQuestionList()}
        </TabsContent>
        <TabsContent value="stats" className="mt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>题型分布</CardTitle>
                <CardDescription>按题目类型统计</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {questionTypes.map(type => {
                    const count = questions.filter(q => q.questionType === type.id).length;
                    const percentage = questions.length ? Math.round((count / questions.length) * 100) : 0;
                    
                    return (
                      <div key={type.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge className={getQuestionTypeColor(type.id)}>
                            {type.name}
                          </Badge>
                          <span className="text-sm text-muted-foreground">{count}题</span>
                        </div>
                        <div className="w-1/3 bg-muted rounded-full h-2 overflow-hidden">
                          <div 
                            className="bg-primary h-full"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="text-sm">{percentage}%</span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>难度分布</CardTitle>
                <CardDescription>按难度级别统计</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {difficultyLevels.map(level => {
                    const count = questions.filter(q => q.difficulty === parseInt(level.id)).length;
                    const percentage = questions.length ? Math.round((count / questions.length) * 100) : 0;
                    const { color } = getDifficultyInfo(parseInt(level.id));
                    
                    return (
                      <div key={level.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge className={color}>
                            {level.name}
                          </Badge>
                          <span className="text-sm text-muted-foreground">{count}题</span>
                        </div>
                        <div className="w-1/3 bg-muted rounded-full h-2 overflow-hidden">
                          <div 
                            className="bg-primary h-full"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="text-sm">{percentage}%</span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
            
            <Card className="md:col-span-2 lg:col-span-1">
              <CardHeader>
                <CardTitle>试题概览</CardTitle>
                <CardDescription>题库试题基本信息</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-muted/50 p-4 rounded-lg">
                      <p className="text-sm text-muted-foreground">总试题数</p>
                      <p className="text-2xl font-bold">{questions.length}</p>
                    </div>
                    <div className="bg-muted/50 p-4 rounded-lg">
                      <p className="text-sm text-muted-foreground">关联知识点</p>
                      <p className="text-2xl font-bold">
                        {questions.filter(q => q.knowledgePointId).length}
                      </p>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium mb-2">最近添加</h4>
                    <div className="space-y-2">
                      {questions.slice(0, 3).map(q => (
                        <div key={q.id} className="text-sm flex justify-between">
                          <span className="truncate flex-1">{q.content.replace(/<[^>]*>/g, '').substring(0, 30)}...</span>
                          <Badge variant="outline">{q.questionType}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 