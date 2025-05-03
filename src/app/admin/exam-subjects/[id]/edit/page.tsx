/**
 * @description 编辑考试科目页面
 * @author 郝桃桃
 * @date 2024-05-24
 */

// 首先创建一个服务器组件作为入口点
export default function EditExamSubjectPage({ params }: { params: { id: string } }) {
  return <EditExamSubjectClient id={params.id} />;
}

// 然后创建一个客户端组件来处理所有逻辑
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { getExamSubject, updateExamSubject, ExamSubjectRequest } from "@/lib/services/exam-subject-service";

// 表单验证Schema
const formSchema = z.object({
  name: z.string().min(1, "科目名称不能为空"),
  description: z.string().min(1, "科目描述不能为空"),
  weight: z.string().min(1, "考试权重不能为空").regex(/^\d+%$/, "权重格式应为数字加百分号，如45%"),
});

type FormData = z.infer<typeof formSchema>;

function EditExamSubjectClient({ id }: { id: string }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      weight: "",
    },
  });

  // 加载科目数据
  useEffect(() => {
    async function loadExamSubject() {
      try {
        const subjectId = parseInt(id);
        if (isNaN(subjectId)) {
          toast.error("无效的科目ID");
          router.push("/admin/exam-subjects");
          return;
        }

        const response = await getExamSubject(subjectId);
        
        if (response.success && response.data) {
          const subject = response.data;
          form.reset({
            name: subject.name,
            description: subject.description,
            weight: subject.weight,
          });
        } else {
          toast.error("获取科目详情失败: " + (response.error || "未知错误"));
          router.push("/admin/exam-subjects");
        }
      } catch (error) {
        console.error("获取科目详情失败:", error);
        toast.error("获取科目详情失败");
        router.push("/admin/exam-subjects");
      } finally {
        setIsLoading(false);
      }
    }

    loadExamSubject();
  }, [id, router, form]);

  async function onSubmit(data: FormData) {
    setIsSubmitting(true);
    try {
      const subjectId = parseInt(id);
      if (isNaN(subjectId)) {
        toast.error("无效的科目ID");
        return;
      }

      const response = await updateExamSubject(subjectId, data as ExamSubjectRequest);
      
      if (response.success) {
        toast.success("科目更新成功");
        router.push("/admin/exam-subjects");
      } else {
        toast.error("更新失败: " + (response.error || response.message || "未知错误"));
      }
    } catch (error) {
      console.error("提交失败:", error);
      toast.error("更新失败，请重试");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-6">
        <p className="text-muted-foreground">正在加载科目信息...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold tracking-tight">编辑考试科目</h1>
        <Link
          href="/admin/exam-subjects"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          返回科目列表
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>科目信息</CardTitle>
          <CardDescription>
            编辑护理职称考试科目及其描述
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>科目名称</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="如：专业知识、专业实践能力等" 
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
                    <FormLabel>科目描述</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="科目的详细描述和考试内容" 
                        rows={4}
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="weight"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>考试权重</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="如：45%"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/admin/exam-subjects")}
                  disabled={isSubmitting}
                >
                  取消
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "保存中..." : "保存更改"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
} 