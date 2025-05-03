/**
 * @description 添加护理学科页面
 * @author 郝桃桃
 * @date 2024-05-23
 */
"use client";

import { useState } from "react";
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

// 表单验证Schema
const formSchema = z.object({
  name: z.string().min(1, "学科名称不能为空"),
  description: z.string().min(1, "学科描述不能为空"),
  imageUrl: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

export default function NewNursingDisciplinePage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      imageUrl: "",
    },
  });

  async function onSubmit(data: FormData) {
    setIsSubmitting(true);
    try {
      // 这里应该调用API将数据保存到数据库
      // 实际项目中应使用fetch发送POST请求
      console.log("提交数据:", data);
      
      // 模拟API调用延迟
      await new Promise(resolve => setTimeout(resolve, 500));
      
      toast.success("学科添加成功");
      router.push("/admin/nursing-disciplines");
    } catch (error) {
      console.error("提交失败:", error);
      toast.error("添加失败，请重试");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold tracking-tight">添加护理学科</h1>
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
            添加新的护理学科及其描述
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
                  {isSubmitting ? "保存中..." : "保存学科"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
} 