/**
 * @description 护理学科管理页面
 * @author 郝桃桃
 * @date 2024-05-23
 */
"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

interface NursingDiscipline {
  id: number;
  name: string;
  description: string;
  imageUrl?: string;
}

export default function NursingDisciplinesPage() {
  const [disciplines, setDisciplines] = useState<NursingDiscipline[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 这里模拟从API获取数据
    // 实际项目中应该使用fetch调用后端API
    setTimeout(() => {
      setDisciplines([
        {
          id: 1,
          name: "内科护理",
          description: "心血管、呼吸、消化、血液、内分泌等系统疾病的护理",
          imageUrl: "/images/disciplines/internal.png",
        },
        {
          id: 2,
          name: "外科护理",
          description: "外伤、手术前后、骨科等外科疾病的护理",
          imageUrl: "/images/disciplines/surgery.png",
        },
        {
          id: 3,
          name: "妇产科护理",
          description: "女性生殖系统疾病、产前产后及新生儿的护理",
          imageUrl: "/images/disciplines/obstetrics.png",
        },
        {
          id: 4,
          name: "儿科护理",
          description: "儿童常见疾病预防和护理、生长发育指导",
          imageUrl: "/images/disciplines/pediatrics.png",
        },
        {
          id: 5,
          name: "急救护理",
          description: "急危重症的紧急救治和护理",
          imageUrl: "/images/disciplines/emergency.png",
        },
        {
          id: 6,
          name: "社区护理",
          description: "社区居民健康管理、慢病护理和健康教育",
          imageUrl: "/images/disciplines/community.png",
        },
      ]);
      setIsLoading(false);
    }, 500);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">护理学科管理</h1>
          <p className="text-muted-foreground">
            管理护理职称考试的六个主要学科
          </p>
        </div>
        <Link
          href="/admin/nursing-disciplines/new"
          className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90"
        >
          添加学科
        </Link>
      </div>

      <div className="rounded-md border">
        <table className="w-full divide-y divide-border">
          <thead>
            <tr className="bg-muted/50">
              <th className="px-4 py-3 text-left text-sm font-medium">ID</th>
              <th className="px-4 py-3 text-left text-sm font-medium">学科名称</th>
              <th className="px-4 py-3 text-left text-sm font-medium">描述</th>
              <th className="px-4 py-3 text-left text-sm font-medium">图标</th>
              <th className="px-4 py-3 text-left text-sm font-medium">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading ? (
              <tr>
                <td className="px-4 py-3 text-sm" colSpan={5}>
                  加载中...
                </td>
              </tr>
            ) : disciplines.length === 0 ? (
              <tr>
                <td className="px-4 py-3 text-sm" colSpan={5}>
                  暂无学科数据，请添加
                </td>
              </tr>
            ) : (
              disciplines.map((discipline) => (
                <tr key={discipline.id}>
                  <td className="px-4 py-3 text-sm">{discipline.id}</td>
                  <td className="px-4 py-3 text-sm font-medium">
                    {discipline.name}
                  </td>
                  <td className="px-4 py-3 text-sm">{discipline.description}</td>
                  <td className="px-4 py-3 text-sm">
                    {discipline.imageUrl ? (
                      <div className="h-8 w-8 overflow-hidden rounded-full bg-gray-100">
                        <img
                          src={discipline.imageUrl}
                          alt={discipline.name}
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            // 图片加载失败时显示占位符
                            (e.target as HTMLImageElement).src = "/images/placeholder.png";
                          }}
                        />
                      </div>
                    ) : (
                      <span className="text-gray-400">无图标</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/admin/nursing-disciplines/${discipline.id}/edit`}
                        className="text-blue-600 hover:underline"
                      >
                        编辑
                      </Link>
                      <span className="text-gray-300">|</span>
                      <Link
                        href={`/admin/nursing-disciplines/${discipline.id}/delete`}
                        className="text-red-600 hover:underline"
                      >
                        删除
                      </Link>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
} 