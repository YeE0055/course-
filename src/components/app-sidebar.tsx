'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  BookOpen,
  ListTree,
  HelpCircle,
  Database,
  FileText,
  BarChart3,
  GraduationCap,
} from 'lucide-react';

const navItems = [
  { href: '/dashboard', label: '数据总览', icon: BarChart3 },
  { href: '/courses', label: '课程管理', icon: BookOpen },
  { href: '/chapters', label: '章节管理', icon: ListTree },
  { href: '/question-types', label: '题型管理', icon: HelpCircle },
  { href: '/questions', label: '题库管理', icon: Database },
  { href: '/exam-papers', label: '组卷管理', icon: FileText },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-60 border-r border-border bg-sidebar">
      <div className="flex h-16 items-center gap-3 border-b border-border px-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <GraduationCap className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-base font-semibold tracking-tight text-foreground">考试题库</h1>
          <p className="text-xs text-muted-foreground">管理系统</p>
        </div>
      </div>
      <nav className="flex flex-col gap-1 p-3">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors duration-150',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              )}
            >
              <item.icon className="h-4.5 w-4.5" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
