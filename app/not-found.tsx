'use client';

import { Sparkles, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 flex items-center justify-center px-4">
      <div className="text-center">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-4xl">🔍</span>
        </div>
        <h2 className="text-xl font-semibold text-gray-700 mb-2">页面未找到</h2>
        <p className="text-gray-500 mb-6">抱歉，你访问的页面不存在</p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-full font-semibold hover:from-pink-600 hover:to-purple-600 transition-all duration-300"
        >
          <ArrowLeft size={20} />
          返回首页
        </Link>
      </div>
    </div>
  );
}
