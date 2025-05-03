/**
 * @description 添加题库页面
 * @author 郝桃桃
 * @date 2024-05-25
 */
"use client";

import { useState, useEffect } from "react";
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
} from "@/components/ui/form";
import { createTestBank, TestBankRequest } from "@/lib/services/test-bank-service";
import { toast } from "sonner";

// 表单验证Schema
const formSchema = z.object({
  name: z.string().min(1, "题库名称不能为空"),
  description: z.string().min(1, "题库描述不能为空"),
  type: z.string().min(1, "请选择题库类型"),
  year: z.string().optional(),
  subjectId: z.string().min(1, "请选择考试科目"),
});

// 表单类型
type FormValues = z.infer<typeof formSchema>;

export default function NewTestBankPage() {
  const [subjects, setSubjects] = useState<{ id: number; name: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // 题库类型
  const bankTypes = [
    { id: "模拟题", name: "模拟题" },
    { id: "历年真题", name: "历年真题" },
    { id: "练习题", name: "练习题" },
  ];

  // 获取考试科目数据
  useEffect(() => {
    async function fetchExamSubjects() {
      try {
        const response = await fetch('/api/admin/exam-subjects');
        const result = await response.json();
        
        if (result.success) {
          setSubjects(result.data);
        } else {
          toast.error("获取考试科目失败", {
            description: result.message,
          });
        }
      } catch (error) {
        console.error("获取考试科目出错:", error);
        toast.error("出错了", {
          description: "获取考试科目时发生错误",
        });
      } finally {
        setIsLoading(false);
      }
    }

    fetchExamSubjects();
  }, []);

  // 初始化表单
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      type: "",
      year: "",
      subjectId: "",
    },
  });

  // 监听题库类型变化
  const watchType = form.watch("type");

  // 添加题库表单提交
  async function onSubmit(values: FormValues) {
    try {
      setIsLoading(true);

      // 准备请求数据
      const testBankData: TestBankRequest = {
        name: values.name,
        description: values.description,
        type: values.type,
        subjectId: parseInt(values.subjectId),
      };

      // 仅对历年真题设置年份
      if (values.type === "历年真题" && values.year && values.year.trim() !== "") {
        testBankData.year = parseInt(values.year);
      } else {
        testBankData.year = null;
      }

      // 发送创建请求
      const result = await createTestBank(testBankData);

      if (result.success) {
        toast.success("创建成功", {
          description: "题库已成功创建",
        });
        // 返回题库列表
        router.push("/admin/test-banks");
      } else {
        toast.error("创建失败", {
          description: result.message || "未能创建题库",
        });
      }
    } catch (error) {
      console.error("创建题库失败:", error);
      toast.error("提交错误", {
        description: "创建题库时出现错误，请稍后重试",
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
            <Link href="/admin/test-banks">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-xl font-bold tracking-tight">添加题库</h1>
        </div>
        <p className="text-muted-foreground text-sm mt-2">
          创建新的题库，用于管理试题
        </p>
      </div>

      <div className="mx-auto max-w-2xl">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="subjectId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>考试科目</FormLabel>
                  <Select
                    disabled={isLoading}
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="选择考试科目" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {subjects.map((subject) => (
                        <SelectItem
                          key={subject.id}
                          value={subject.id.toString()}
                        >
                          {subject.name}
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
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>题库类型</FormLabel>
                  <Select
                    disabled={isLoading}
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="选择题库类型" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {bankTypes.map((type) => (
                        <SelectItem key={type.id} value={type.id}>
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {watchType === "历年真题" && (
              <FormField
                control={form.control}
                name="year"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>年份</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="请输入年份，如2024"
                        disabled={isLoading}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>题库名称</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="请输入题库名称"
                      disabled={isLoading}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>题库描述</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="请输入题库描述内容"
                      className="resize-none"
                      rows={4}
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
                onClick={() => router.push("/admin/test-banks")}
                className="flex-1"
              >
                取消
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading ? "提交中..." : "创建题库"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
} 