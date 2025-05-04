"use client";

/**
 * @description 添加试题客户端组件
 * @author 郝桃桃
 * @date 2024-05-26
 */

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { getTestBank } from "@/lib/services/test-bank-service";
import { TestBank } from "@/lib/services/test-bank-service";
import { createQuizQuestion, QuizQuestionRequest } from "@/lib/services/quiz-question-service";
import { toast } from "sonner";

// 定义一个常量表示无关联知识点的值
const NO_KNOWLEDGE_POINT_VALUE = "__NONE__";

// Schema for form input values (mostly strings)
const formInputSchema = z.object({
  testBankId: z.number().int().positive("题库ID必须是正整数"), // Keep as number, it's not directly edited
  knowledgePointId: z.string().optional(), // String from Select
  questionType: z.string().min(1, "请选择题目类型"),
  content: z.string().min(1, "题目内容不能为空"),
  options: z.string().optional(), // JSON string
  correctAnswer: z.string().min(1, "正确答案不能为空"),
  explanation: z.string().min(1, "题目解析不能为空"),
  difficulty: z.string().min(1, "请选择难度级别"), // String from Select
});

// Schema for validated and transformed output data
const formOutputSchema = formInputSchema.transform((data, ctx) => {
  const parsedDifficulty = parseInt(data.difficulty);
  if (isNaN(parsedDifficulty) || parsedDifficulty < 1 || parsedDifficulty > 5) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "难度必须是1-5之间的有效数字",
      path: ["difficulty"],
    });
    return z.NEVER;
  }
  
  return {
    ...data,
    knowledgePointId: (data.knowledgePointId && data.knowledgePointId !== NO_KNOWLEDGE_POINT_VALUE) 
                        ? parseInt(data.knowledgePointId) 
                        : null,
    difficulty: parsedDifficulty,
    // options will be handled separately in onSubmit
  };
});

// Type for the form's *input* values (used with useForm)
type FormInputValues = z.infer<typeof formInputSchema>;
// Type for the *output* data after validation/transformation (used in onSubmit)
type FormOutputValues = z.infer<typeof formOutputSchema>;

export default function NewQuizQuestionClient({ id }: { id: string }) {
  const [testBank, setTestBank] = useState<TestBank | null>(null);
  const [knowledgePoints, setKnowledgePoints] = useState<{ id: number; title: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [optionsArray, setOptionsArray] = useState<{key: string; value: string}[]>([
    { key: "A", value: "" },
    { key: "B", value: "" },
    { key: "C", value: "" },
    { key: "D", value: "" }
  ]);
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

  // 获取题库数据和知识点列表
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
        
        // 获取知识点列表
        if (testBankResult.data?.subjectId) {
          const response = await fetch(`/api/admin/knowledge-points?subjectId=${testBankResult.data.subjectId}`);
          const result = await response.json();
          
          if (result.success) {
            setKnowledgePoints(result.data || []);
          } else {
            toast.error("获取知识点列表失败", {
              description: result.message,
            });
          }
        }
      } catch (error) {
        console.error("获取数据出错:", error);
        toast.error("出错了", {
          description: "获取数据时发生错误",
        });
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [id, router]);

  // 初始化表单 - 使用 FormInputValues 类型
  const form = useForm<FormInputValues>({
    resolver: zodResolver(formInputSchema), // Resolve against input schema initially
    defaultValues: {
      testBankId: parseInt(id),
      knowledgePointId: NO_KNOWLEDGE_POINT_VALUE,
      questionType: "",
      content: "",
      options: JSON.stringify(optionsArray),
      correctAnswer: "",
      explanation: "",
      difficulty: "",
    }
  });

  // 监听题目类型变化
  const watchQuestionType = form.watch("questionType");

  // 更新选项值 (wrap in useCallback)
  const updateOption = useCallback((index: number, field: 'key' | 'value', value: string) => {
    const updatedOptions = [...optionsArray];
    if (updatedOptions[index]) {
      updatedOptions[index][field] = value;
      setOptionsArray(updatedOptions);
      form.setValue('options', JSON.stringify(updatedOptions));
    }
  }, [optionsArray, form]);

  // 更新选项 useEffect (add updateOption to dependencies)
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name?.startsWith('option')) {
        const [, indexStr, field] = name.split('.');
        const index = parseInt(indexStr);
        if (!isNaN(index)) {
             // Ensure value is treated as string before passing
            const val = value[name as keyof typeof value];
            updateOption(index, field as 'key' | 'value', String(val ?? ''));
        }
      }
    });
    return () => subscription.unsubscribe();
  }, [form, updateOption]); // form.watch itself might be stable, but including form is safer

  // 添加选项
  function addOption() {
    const nextKey = String.fromCharCode('A'.charCodeAt(0) + optionsArray.length);
    const newOptions = [...optionsArray, { key: nextKey, value: "" }];
    setOptionsArray(newOptions);
    form.setValue('options', JSON.stringify(newOptions));
  }

  // 删除选项
  function removeOption(index: number) {
    if (optionsArray.length <= 2) {
      toast.error("至少需要两个选项");
      return;
    }
    
    const newOptions = [...optionsArray];
    newOptions.splice(index, 1);
    
    // 重新分配选项的key (A, B, C...)
    newOptions.forEach((option, idx) => {
      option.key = String.fromCharCode('A'.charCodeAt(0) + idx);
    });
    
    setOptionsArray(newOptions);
    form.setValue('options', JSON.stringify(newOptions));
    
    // 如果删除的选项是正确答案，清空正确答案
    const correctAnswer = form.getValues('correctAnswer');
    const deletedKey = optionsArray[index].key;
    if (correctAnswer.includes(deletedKey)) {
      // 如果是单选题，直接清空
      if (watchQuestionType === '单选题') {
        form.setValue('correctAnswer', '');
      } else if (watchQuestionType === '多选题') {
        // 如果是多选题，删除对应的选项
        const newAnswer = correctAnswer.split(',').filter(key => key !== deletedKey).join(',');
        form.setValue('correctAnswer', newAnswer);
      }
    }
  }

  // 添加试题表单提交
  async function onSubmit(data: FormInputValues) { // Receive input values
    // Validate and transform using the output schema
    const validationResult = formOutputSchema.safeParse(data);

    if (!validationResult.success) {
      // Handle validation errors - zodResolver might already do this,
      // but manual check ensures correct types for submission.
      console.error("Form validation failed:", validationResult.error.format());
      // Potentially update form errors state if needed
      toast.error("表单验证失败，请检查输入");
      return;
    }

    const values: FormOutputValues = validationResult.data; // Use validated/transformed data

    try {
      setIsLoading(true);

      // 准备选项数据
      let optionsData = null;
      if (values.questionType === '单选题' || values.questionType === '多选题') {
        optionsData = optionsArray;
      } else if (values.questionType === '判断题') {
        optionsData = [
          { key: "A", value: "正确" },
          { key: "B", value: "错误" }
        ];
      }

      // 准备请求数据 - 使用转换后的 values
      const questionData: QuizQuestionRequest = {
        testBankId: values.testBankId,
        knowledgePointId: values.knowledgePointId, // Already number | null
        questionType: values.questionType,
        content: values.content,
        options: optionsData,
        correctAnswer: values.correctAnswer,
        explanation: values.explanation,
        difficulty: values.difficulty, // Already number
      };

      // 发送创建请求
      const result = await createQuizQuestion(questionData);

      if (result.success) {
        toast.success("创建成功", {
          description: "试题已成功创建",
        });
        router.push(`/admin/test-banks/${id}/quiz-questions`);
      } else {
        toast.error("创建失败", {
          description: result.message || "未能创建试题",
        });
      }
    } catch (error: unknown) {
      console.error("创建试题失败:", error);
      const message = error instanceof Error ? error.message : "未知错误";
      toast.error("提交错误", {
        description: message || "创建试题时出现错误，请稍后重试",
      });
    } finally {
      setIsLoading(false);
    }
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
            <Link href={`/admin/test-banks/${id}/quiz-questions`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-xl font-bold tracking-tight">添加试题</h1>
        </div>
        {testBank && (
          <p className="text-muted-foreground text-sm mt-2">
            添加试题到题库: {testBank.name}
          </p>
        )}
      </div>

      <div className="mx-auto max-w-3xl">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="questionType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>题目类型</FormLabel>
                    <Select
                      disabled={isLoading}
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="选择题目类型" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
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
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="difficulty"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>难度级别</FormLabel>
                    <Select
                      disabled={isLoading}
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="选择难度级别" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
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
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="knowledgePointId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>关联知识点 (可选)</FormLabel>
                  <Select
                    disabled={isLoading || knowledgePoints.length === 0}
                    onValueChange={field.onChange}
                    value={field.value || NO_KNOWLEDGE_POINT_VALUE}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={knowledgePoints.length ? "选择关联知识点" : "无可选知识点"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={NO_KNOWLEDGE_POINT_VALUE}>不关联知识点</SelectItem>
                      {knowledgePoints.map((point) => (
                        <SelectItem
                          key={point.id}
                          value={point.id.toString()}
                        >
                          {point.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    关联知识点可以帮助学习者按知识点练习
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>题目内容</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="请输入题目内容，支持HTML标签用于格式化"
                      className="resize-none min-h-[120px]"
                      disabled={isLoading}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    如需格式化文本，可使用HTML标签，例如&lt;b&gt;加粗&lt;/b&gt;
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {(watchQuestionType === '单选题' || watchQuestionType === '多选题') && (
              <div className="space-y-4 border p-4 rounded-md">
                <div className="flex justify-between items-center">
                  <h3 className="text-base font-medium">选项</h3>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={addOption}
                    size="sm"
                  >
                    添加选项
                  </Button>
                </div>

                {optionsArray.map((option, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="w-10">
                      <Input 
                        value={option.key}
                        onChange={(e) => updateOption(index, 'key', e.target.value)}
                        disabled={isLoading}
                        className="text-center"
                      />
                    </div>
                    <div className="flex-1">
                      <Input 
                        value={option.value}
                        onChange={(e) => updateOption(index, 'value', e.target.value)}
                        disabled={isLoading}
                        placeholder={`选项${option.key}内容`}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeOption(index)}
                      className="text-red-500"
                    >
                      删除
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <FormField
              control={form.control}
              name="correctAnswer"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>正确答案</FormLabel>
                  {(watchQuestionType === '单选题') && (
                    <Select
                      disabled={isLoading}
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="选择正确答案" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {optionsArray.map((option) => (
                          <SelectItem
                            key={option.key}
                            value={option.key}
                          >
                            {option.key}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  
                  {(watchQuestionType === '多选题') && (
                    <div className="flex flex-wrap gap-2">
                      {optionsArray.map((option) => (
                        <div key={option.key} className="flex items-center gap-2">
                          <input 
                            type="checkbox"
                            id={`option-${option.key}`}
                            value={option.key}
                            checked={field.value.includes(option.key)}
                            onChange={(e) => {
                              const values = field.value.split(',').filter(v => v !== "");
                              if (e.target.checked) {
                                if (!values.includes(option.key)) {
                                  values.push(option.key);
                                }
                              } else {
                                const index = values.indexOf(option.key);
                                if (index >= 0) {
                                  values.splice(index, 1);
                                }
                              }
                              field.onChange(values.join(','));
                            }}
                            disabled={isLoading}
                          />
                          <label htmlFor={`option-${option.key}`}>
                            选项 {option.key}
                          </label>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {(watchQuestionType === '判断题') && (
                    <Select
                      disabled={isLoading}
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="选择正确答案" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="A">正确</SelectItem>
                        <SelectItem value="B">错误</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                  
                  {(watchQuestionType === '简答题' || watchQuestionType === '案例分析题') && (
                    <FormControl>
                      <Textarea
                        placeholder="请输入参考答案"
                        className="resize-none"
                        rows={3}
                        disabled={isLoading}
                        {...field}
                      />
                    </FormControl>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="explanation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>解析</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="请输入题目解析"
                      className="resize-none"
                      rows={3}
                      disabled={isLoading}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                disabled={isLoading}
                onClick={() => router.push(`/admin/test-banks/${id}/quiz-questions`)}
                className="flex-1"
              >
                取消
              </Button>
              <Button
                type="submit"
                disabled={isLoading || !watchQuestionType}
                className="flex-1"
              >
                {isLoading ? "提交中..." : "添加试题"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
} 