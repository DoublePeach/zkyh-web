/**
 * @description 管理后台主布局
 * @author 郝桃桃
 * @date 2024-05-23
 */
import type { Metadata } from "next";
import AdminLayoutClient from "./AdminLayoutClient";

export const metadata: Metadata = {
  title: "智考引航 - 管理后台",
  description: "管理学习资源和用户数据",
};

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  return <AdminLayoutClient>{children}</AdminLayoutClient>;
} 