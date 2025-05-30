/**
 * @description 添加知识点页面
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
import { createKnowledgePoint, KnowledgePointRequest } from "@/lib/services/knowledge-point-service";
import { getAllNursingDisciplines, NursingDiscipline } from "@/lib/services/nursing-discipline-service";
import { getAllChapters, Chapter } from "@/lib/services/chapter-service";
import { getAllExamSubjects, ExamSubject } from "@/lib/services/exam-subject-service";

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

  // Watch the disciplineId value outside useEffect
  const watchedDisciplineId = form.watch("disciplineId");

  // 获取所有护理学科和考试科目
  useEffect(() => {
    async function loadData() {
      setIsLoadingDisciplines(true);
      try {
        // 获取护理学科
        const disciplinesResponse = await getAllNursingDisciplines();
        if (disciplinesResponse.success && disciplinesResponse.data) {
          setDisciplines(disciplinesResponse.data);
        } else {
          toast.error("获取护理学科失败: " + (disciplinesResponse.error || "未知错误"));
        }
        
        // 获取考试科目
        const subjectsResponse = await getAllExamSubjects();
        if (subjectsResponse.success && subjectsResponse.data) {
          setSubjects(subjectsResponse.data);
        } else {
          toast.error("获取考试科目失败: " + (subjectsResponse.error || "未知错误"));
        }
      } catch (error) {
        console.error("初始化数据失败:", error);
        toast.error("加载数据失败");
      } finally {
        setIsLoadingDisciplines(false);
      }
    }

    loadData();
  }, []);

  // 基于选择的学科获取章节
  useEffect(() => {
    // Use the watched value
    if (!watchedDisciplineId || watchedDisciplineId === "") { 
      setChapters([]);
      // Reset chapterId field when discipline changes to none
      // Note: Directly calling setValue inside useEffect dependent on watched value
      // can sometimes lead to complex state interactions. Consider if this reset
      // could happen elsewhere or if the dependency on `form.setValue` is needed.
      // For now, we assume form.setValue reference is stable enough or this effect
      // primarily runs due to watchedDisciplineId change.
      form.setValue("chapterId", ""); 
      return;
    }

    let isMounted = true;
    setIsLoadingChapters(true);
    
    async function loadChapters() {
      try {
        const discId = parseInt(watchedDisciplineId);
        if (isNaN(discId)) {
            if(isMounted) setChapters([]);
            if(isMounted) form.setValue("chapterId", ""); 
            return; 
        }

        const chaptersResponse = await getAllChapters(discId);
        
        if(isMounted){
            if (chaptersResponse.success && chaptersResponse.data) {
              setChapters(chaptersResponse.data);
            } else {
              toast.error("获取章节失败: " + (chaptersResponse.error || "未知错误"));
              setChapters([]); // Clear on error
              form.setValue("chapterId", ""); // Reset chapter selection
            }
        }
      } catch (error) {
        console.error("获取章节失败:", error);
         if(isMounted) toast.error("获取章节失败");
         if(isMounted) setChapters([]); // Clear on error
         if(isMounted) form.setValue("chapterId", ""); // Reset chapter selection
      } finally {
        if(isMounted) setIsLoadingChapters(false);
      }
    }

    loadChapters();

    // Cleanup function
    return () => { isMounted = false; };

  // Correct dependency: ONLY depend on the actual watched value
  }, [watchedDisciplineId, form]); // Ensure `form` is included

  async function onSubmit(data: FormData) {
    setIsSubmitting(true);
    try {
      // 修复：格式化数据，确保关键词数组格式正确，标签为JSON对象
      const formattedData: KnowledgePointRequest = {
        chapterId: parseInt(data.chapterId),
        subjectId: parseInt(data.subjectId),
        title: data.title,
        content: data.content,
        difficulty: data.difficulty,
        importance: data.importance,
        // 直接传递简单的字符串数组，不是JSON字符串
        keywords: data.keywords ? data.keywords.split(',').map(k => k.trim()) : undefined,
        tags: data.tags ? JSON.parse(`{${data.tags}}`) : undefined,
      };
      
      // 调用API保存数据
      const response = await createKnowledgePoint(formattedData);
      
      if (response.success) {
        toast.success("知识点添加成功");
        router.push("/admin/knowledge-points");
      } else {
        toast.error("添加失败: " + (response.error || response.message || "未知错误"));
      }
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