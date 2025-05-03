/**
 * @description 编辑护理学科页面
 * @author 郝桃桃
 * @date 2024-05-24
 */

// 首先创建一个服务器组件作为入口点
export default function EditNursingDisciplinePage({ params }: { params: { id: string } }) {
  return <EditNursingDisciplineClient id={params.id} />;
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
import { 
  getNursingDiscipline, 
  updateNursingDiscipline, 
  NursingDisciplineRequest 
} from "@/lib/services/nursing-discipline-service";

// 表单验证Schema
const formSchema = z.object({
  name: z.string().min(1, "学科名称不能为空"),
  description: z.string().min(1, "学科描述不能为空"),
  imageUrl: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

function EditNursingDisciplineClient({ id }: { id: string }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      imageUrl: "",
    },
  });

  // 加载学科数据
  useEffect(() => {
    async function loadNursingDiscipline() {
      try {
        const disciplineId = parseInt(id);
        if (isNaN(disciplineId)) {
          toast.error("无效的学科ID");
          router.push("/admin/nursing-disciplines");
          return;
        }

        const response = await getNursingDiscipline(disciplineId);
        
        if (response.success && response.data) {
          const discipline = response.data;
          form.reset({
            name: discipline.name,
            description: discipline.description,
            imageUrl: discipline.imageUrl || "",
          });
        } else {
          toast.error("获取学科详情失败: " + (response.error || "未知错误"));
          router.push("/admin/nursing-disciplines");
        }
      } catch (error) {
        console.error("获取学科详情失败:", error);
        toast.error("获取学科详情失败");
        router.push("/admin/nursing-disciplines");
      } finally {
        setIsLoading(false);
      }
    }

    loadNursingDiscipline();
  }, [id, router, form]);

  async function onSubmit(data: FormData) {
    setIsSubmitting(true);
    try {
      const disciplineId = parseInt(id);
      if (isNaN(disciplineId)) {
        toast.error("无效的学科ID");
        return;
      }

      const response = await updateNursingDiscipline(disciplineId, data as NursingDisciplineRequest);
      
      if (response.success) {
        toast.success("学科更新成功");
        router.push("/admin/nursing-disciplines");
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
        <p className="text-muted-foreground">正在加载学科信息...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold tracking-tight">编辑护理学科</h1>
        <Link
          href="/admin/nursing-disciplines"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          返回学科列表
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>学科信息</CardTitle>
          <CardDescription>
            编辑护理学科及其描述
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
                    <FormLabel>学科名称</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="如：内科护理、外科护理等" 
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
                    <FormLabel>学科描述</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="学科的详细描述和内容范围" 
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
                name="imageUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>图标URL <span className="text-xs text-muted-foreground">(可选)</span></FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="图标图片的URL地址"
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
                  onClick={() => router.push("/admin/nursing-disciplines")}
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