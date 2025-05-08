import type { Metadata } from "next";
// import { Inter } from "next/font/google"; // Remove or comment out Google Font import
import localFont from 'next/font/local'; // Import localFont
import "./globals.css";
import { Toaster } from '@/components/ui/sonner';
import AppLayoutClient from "@/components/layouts/app-layout-client";
import { cn } from "@/lib/utils"; // Import cn if not already present
import NursingAssistantLogin from '@/components/shared/NursingAssistantLogin';
import { Suspense } from 'react';

// Configure local font
const fontSans = localFont({
  src: [
    {
      path: '../../public/fonts/Inter_28pt-Regular.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../../public/fonts/Inter_18pt-Medium.woff2',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../../public/fonts/Inter_28pt-SemiBold.woff2',
      weight: '600',
      style: 'normal',
    },
    {
      path: '../../public/fonts/Inter_18pt-Bold.woff2',
      weight: '700',
      style: 'normal',
    },
    // Add more weights/styles if needed
  ],
  variable: "--font-inter", // Keep the same CSS variable name
  display: 'swap', // Optional: Font display strategy
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
    <html lang="zh-CN" suppressHydrationWarning>
      {/* Use cn utility to apply font variable */}
      <body className={cn("antialiased", fontSans.variable)}>
        <AppLayoutClient>
          <Toaster />
          <Suspense fallback={null}>
            <NursingAssistantLogin />
          </Suspense>
          {children}
        </AppLayoutClient>
      </body>
    </html>
  );
}
