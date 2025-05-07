'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, BookOpen, User, Menu, ArrowRight, Settings, BookMarked, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from '@/components/ui/sheet';
import Image from 'next/image';

export function DrawerNav() {
  const pathname = usePathname();
  
  const navItems = [
    {
      href: '/',
      label: '首页',
      icon: Home,
      active: pathname === '/',
    },
    {
      href: '/study-plans',
      label: '备考规划',
      icon: BookMarked,
      active: pathname.startsWith('/study-plan'),
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
    {
      href: '/settings',
      label: '设置',
      icon: Settings,
      active: pathname.startsWith('/settings'),
    }
  ];
  
  return (
    <div className="flex justify-between items-center px-4 py-3 border-b bg-white">
      <div className="flex items-center gap-2">
        <Image 
          src="/logo.png" 
          alt="智考引航" 
          width={32} 
          height={32} 
          priority
          className="object-contain"
        />
        <span className="text-xl font-bold text-gray-900">智考引航</span>
      </div>
      
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="rounded-full text-gray-500 hover:text-gray-700">
          <Bell className="h-5 w-5" />
        </Button>
        
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full text-gray-500 hover:text-gray-700">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent className="w-[300px] sm:w-[380px]">
            <SheetHeader className="py-6 border-b">
              <div className="flex items-center gap-3">
                <Image 
                  src="/logo.png" 
                  alt="智考引航" 
                  width={48} 
                  height={48} 
                  className="object-contain"
                />
                <div>
                  <SheetTitle className="text-left">智考引航</SheetTitle>
                  <p className="text-sm text-gray-500">医护考试备考助手</p>
                </div>
              </div>
            </SheetHeader>
            
            <div className="mt-6 flex flex-col gap-1">
              {navItems.map((item) => (
                <SheetClose asChild key={item.href}>
                  <Link href={item.href}>
                    <div 
                      className={`flex items-center gap-3 p-4 rounded-md transition-colors ${
                        item.active 
                          ? 'bg-primary/10 text-primary' 
                          : 'hover:bg-gray-100'
                      }`}
                    >
                      <item.icon className="h-5 w-5" />
                      <span className="flex-1 font-medium">{item.label}</span>
                      <ArrowRight className={`h-4 w-4 ${item.active ? 'text-primary' : 'text-gray-400'}`} />
                    </div>
                  </Link>
                </SheetClose>
              ))}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
} 