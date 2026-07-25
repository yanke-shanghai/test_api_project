'use client';

import { Sparkles, LogIn, LogOut, UserPlus } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import Link from 'next/link';

export default function Header() {
  const { isLoggedIn, user, logout } = useAuth();

  return (
    <header className="py-4 px-4 bg-white/80 backdrop-blur-sm shadow-sm sticky top-0 z-50">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="p-1.5 bg-gradient-to-r from-pink-500 to-purple-500 rounded-lg">
            <Sparkles className="text-white" size={20} />
          </div>
          <span className="font-bold text-lg bg-gradient-to-r from-pink-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
            AI试衣魔法
          </span>
        </Link>

        {/* Navigation */}
        <nav className="flex items-center gap-4">
          {!isLoggedIn ? (
            // 未登录状态：显示登录和注册链接
            <>
              <Link
                href="/login"
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-all duration-300"
              >
                <LogIn size={18} />
                登录
              </Link>
              <Link
                href="/register"
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-full font-semibold hover:from-pink-600 hover:to-purple-600 transition-all duration-300 shadow-md"
              >
                <UserPlus size={18} />
                注册
              </Link>
            </>
          ) : (
            // 已登录状态：显示用户邮箱和退出按钮
            <>
              <span className="text-gray-600 font-medium mr-2">
                {user?.email}
              </span>
              <button
                onClick={logout}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-full transition-all duration-300"
              >
                <LogOut size={18} />
                退出登录
              </button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
