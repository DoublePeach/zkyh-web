import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="container max-w-md mx-auto flex-1 p-5">
        <div className="mb-6">
          <Link href="/" className="flex items-center text-sm text-gray-500 hover:text-gray-700">
            <ArrowLeft className="h-4 w-4 mr-1" />
            返回首页
          </Link>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          {children}
        </div>
      </div>
    </div>
  );
} 