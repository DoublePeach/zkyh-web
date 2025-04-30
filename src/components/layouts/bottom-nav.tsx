'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, BookOpen, User } from 'lucide-react';

export function BottomNav() {
  const pathname = usePathname();
  
  const links = [
    {
      href: '/',
      label: '首页',
      icon: Home,
      active: pathname === '/',
    },
    {
      href: '/learn',
      label: '学习',
      icon: BookOpen,
      active: pathname.startsWith('/learn'),
    },
    {
      href: '/profile',
      label: '我的',
      icon: User,
      active: pathname.startsWith('/profile'),
    },
  ];
  
  return (
    <nav className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 py-2">
      <div className="flex justify-around">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`flex flex-col items-center ${
              link.active ? 'text-primary' : 'text-gray-500'
            }`}
          >
            <link.icon size={24} />
            <span className="text-xs mt-1">{link.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
} 