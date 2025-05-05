import type { Metadata } from "next";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "智考引航 - 开始您的学习之旅",
  description: "AI辅助护理职称考试学习平台",
};

export default function OnboardingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="fixed inset-0 z-50 w-full h-full overflow-hidden">
      {children}
    </div>
  );
} 