/**
 * @description 添加知识点页面
 * @author 郝桃桃
 * @date 2024-05-23
 */
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
  FormDescription,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface NursingDiscipline {
  id: number;
  name: string;
}

interface Chapter {
  id: number;
  name: string;
  disciplineId: number;
}

interface ExamSubject {
  id: number;
  name: string;
}

// 表单验证Schema
const formSchema = z.object({
  title: z.string().min(1, "知识点标题不能为空"),
  content: z.string().min(1, "知识点内容不能为空"),
  disciplineId: z.string().min(1, "请选择护理学科"),
  chapterId: z.string().min(1, "请选择章节"),
  subjectId: z.string().min(1, "请选择考试科目"),
  difficulty: z.coerce.number().min(1).max(5),
  importance: z.coerce.number().min(1).max(5),
  keywords: z.string().optional(),
  tags: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

export default function NewKnowledgePointPage() {
  const router = useRouter();
  const [disciplines, setDisciplines] = useState<NursingDiscipline[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [subjects, setSubjects] = useState<ExamSubject[]>([]);
  const [isLoadingDisciplines, setIsLoadingDisciplines] = useState(true);
  const [isLoadingChapters, setIsLoadingChapters] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("basic");
  
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      content: "",
      disciplineId: "",
      chapterId: "",
      subjectId: "",
      difficulty: 3,
      importance: 3,
      keywords: "",
      tags: "",
    },
  });

  // 获取所有护理学科和考试科目
  useEffect(() => {
    // 这里模拟从API获取数据
    setIsLoadingDisciplines(true);
    
    // 获取护理学科
    setTimeout(() => {
      setDisciplines([
        { id: 1, name: "内科护理" },
        { id: 2, name: "外科护理" },
        { id: 3, name: "妇产科护理" },
        { id: 4, name: "儿科护理" },
        { id: 5, name: "急救护理" },
        { id: 6, name: "社区护理" },
      ]);
      
      // 获取考试科目
      setSubjects([
        { id: 1, name: "专业知识" },
        { id: 2, name: "专业实践能力" },
        { id: 3, name: "现场论文答辩" },
        { id: 4, name: "外语水平" },
      ]);
      
      setIsLoadingDisciplines(false);
    }, 300);
  }, []);

  // 基于选择的学科获取章节
  useEffect(() => {
    const disciplineId = form.watch("disciplineId");
    
    if (!disciplineId) {
      setChapters([]);
      form.setValue("chapterId", "");
      return;
    }

    setIsLoadingChapters(true);
    
    // 这里模拟从API获取章节数据
    setTimeout(() => {
      const discId = parseInt(disciplineId);
      const chapterCount = discId === 1 ? 6 : discId === 2 ? 5 : 4;
      const chapterData: Chapter[] = [];
      
      for (let i = 1; i <= chapterCount; i++) {
        chapterData.push({
          id: (discId - 1) * 10 + i,
          name: `第${i}章 ${getDisciplineName(discId)}的基本概念和理论`,
          disciplineId: discId,
        });
      }
      
      setChapters(chapterData);
      setIsLoadingChapters(false);
    }, 300);
  }, [form.watch("disciplineId")]);

  // 获取学科名称
  function getDisciplineName(id: number): string {
    const discipline = disciplines.find(d => d.id === id);
    return discipline ? discipline.name : "";
  }

  async function onSubmit(data: FormData) {
    setIsSubmitting(true);
    try {
      // 格式化数据，转换关键词为数组，标签为JSON对象
      const formattedData = {
        ...data,
        keywords: data.keywords ? data.keywords.split(',').map(k => k.trim()) : [],
        tags: data.tags ? JSON.parse(`{${data.tags}}`) : {},
      };
      
      // 这里应该调用API将数据保存到数据库
      console.log("提交数据:", formattedData);
      
      // 模拟API调用延迟
      await new Promise(resolve => setTimeout(resolve, 500));
      
      toast.success("知识点添加成功");
      router.push("/admin/knowledge-points");
    } catch (error) {
      console.error("提交失败:", error);
      toast.error("添加失败，请重试");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold tracking-tight">添加知识点</h1>
        <Link
          href="/admin/knowledge-points"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          返回知识点列表
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>知识点信息</CardTitle>
          <CardDescription>
            添加新的护理学科知识点
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-3 mb-6">
                  <TabsTrigger value="basic">基本信息</TabsTrigger>
                  <TabsTrigger value="content">知识点内容</TabsTrigger>
                  <TabsTrigger value="meta">元数据设置</TabsTrigger>
                </TabsList>
                
                <TabsContent value="basic" className="space-y-4">
                  {/* 基本信息表单 */}
                  <div className="grid gap-4 grid-cols-2">
                    <FormField
                      control={form.control}
                      name="disciplineId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>所属护理学科</FormLabel>
                          <Select
                            disabled={isLoadingDisciplines}
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="选择护理学科" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {disciplines.map((discipline) => (
                                <SelectItem
                                  key={discipline.id}
                                  value={discipline.id.toString()}
                                >
                                  {discipline.name}
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
                      name="chapterId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>所属章节</FormLabel>
                          <Select
                            disabled={isLoadingChapters || !form.watch("disciplineId")}
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="选择章节" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {chapters.map((chapter) => (
                                <SelectItem
                                  key={chapter.id}
                                  value={chapter.id.toString()}
                                >
                                  {chapter.name}
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
                    name="subjectId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>所属考试科目</FormLabel>
                        <Select
                          disabled={isLoadingDisciplines}
                          onValueChange={field.onChange}
                          value={field.value}
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
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>知识点标题</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="输入知识点标题，简明扼要地概括知识点"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="pt-2 flex justify-end">
                    <Button
                      type="button"
                      onClick={() => setActiveTab("content")}
                      disabled={isSubmitting}
                    >
                      下一步：填写内容
                    </Button>
                  </div>
                </TabsContent>
                
                <TabsContent value="content" className="space-y-4">
                  {/* 知识点内容表单 */}
                  <FormField
                    control={form.control}
                    name="content"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>知识点内容</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="详细描述知识点内容，可包含定义、解释、应用场景等"
                            rows={15}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="pt-2 flex justify-between">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setActiveTab("basic")}
                      disabled={isSubmitting}
                    >
                      返回基本信息
                    </Button>
                    <Button
                      type="button"
                      onClick={() => setActiveTab("meta")}
                      disabled={isSubmitting}
                    >
                      下一步：设置元数据
                    </Button>
                  </div>
                </TabsContent>
                
                <TabsContent value="meta" className="space-y-4">
                  {/* 元数据设置表单 */}
                  <div className="grid gap-6 grid-cols-2">
                    <FormField
                      control={form.control}
                      name="difficulty"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            难度级别: {field.value}
                          </FormLabel>
                          <FormControl>
                            <Slider
                              min={1}
                              max={5}
                              step={1}
                              defaultValue={[field.value]}
                              onValueChange={(vals: number[]) => field.onChange(vals[0])}
                              className="pt-2"
                            />
                          </FormControl>
                          <FormDescription className="text-xs">
                            1(简单) - 5(困难)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="importance"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            重要程度: {field.value}
                          </FormLabel>
                          <FormControl>
                            <Slider
                              min={1}
                              max={5}
                              step={1}
                              defaultValue={[field.value]}
                              onValueChange={(vals: number[]) => field.onChange(vals[0])}
                              className="pt-2"
                            />
                          </FormControl>
                          <FormDescription className="text-xs">
                            1(一般) - 5(核心)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="keywords"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>关键词</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="输入关键词，用逗号分隔"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription className="text-xs">
                          例如：心血管,护理评估,高血压
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="tags"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>标签 (JSON格式)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder='输入JSON格式的标签，如："type": "理论", "level": "初级"'
                            {...field}
                          />
                        </FormControl>
                        <FormDescription className="text-xs">
                          JSON格式，无需包含外层括号，直接输入key-value对
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="pt-4 flex justify-between">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setActiveTab("content")}
                      disabled={isSubmitting}
                    >
                      返回内容编辑
                    </Button>
                    <div className="space-x-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => router.push("/admin/knowledge-points")}
                        disabled={isSubmitting}
                      >
                        取消
                      </Button>
                      <Button
                        type="submit"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? "保存中..." : "保存知识点"}
                      </Button>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
} 