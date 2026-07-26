'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { LayoutDashboard, Users, ClipboardList, LogOut } from 'lucide-react';

const navItems = [
  { href: '/admin', label: '概览', icon: LayoutDashboard },
  { href: '/admin/users', label: '用户管理', icon: Users },
  { href: '/admin/tasks', label: '任务管理', icon: ClipboardList },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { isLoggedIn, isAdmin, user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    // 鉴权重定向逻辑
    if (!isLoggedIn) {
      router.push('/login');
      return;
    }
    if (!isAdmin) {
      router.push('/');
      return;
    }
    setChecked(true);
  }, [isLoggedIn, isAdmin, router]);

  // 未通过鉴权时不渲染内容
  if (!checked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">加载中...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部标题区 */}
      <header className="h-[60px] bg-white border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-50">
        <h1 className="text-lg font-bold text-gray-800">AI试衣管理后台</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">{user?.email}</span>
          <button
            onClick={() => {
              logout();
              router.push('/login');
            }}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-red-500 transition-colors"
          >
            <LogOut size={16} />
            退出登录
          </button>
        </div>
      </header>

      <div className="flex">
        {/* 左侧导航 */}
        <nav className="w-[200px] min-h-[calc(100vh-60px)] bg-white border-r border-gray-200 py-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-6 py-3 text-sm transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-600 border-r-2 border-blue-600 font-medium'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* 主内容区 */}
        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
