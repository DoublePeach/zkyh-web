import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from '@/components/ui/sonner';
import AppLayoutClient from "@/components/layouts/app-layout-client";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "医疗职称备考智能助手",
  description: "AI驱动的个性化医疗职称备考助手",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className={`${inter.variable} antialiased`}>
        <AppLayoutClient>
          {children}
        </AppLayoutClient>
        <Toaster />
      </body>
    </html>
  );
}
