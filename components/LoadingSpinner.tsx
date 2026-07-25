'use client';

import React from 'react';

interface LoadingSpinnerProps {
  message?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  message = 'AI正在为您换衣中...',
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="relative">
        <div className="w-20 h-20 border-4 border-pink-200 rounded-full"></div>
        <div className="w-20 h-20 border-4 border-pink-500 rounded-full border-t-transparent animate-spin absolute top-0 left-0"></div>
        <div className="w-20 h-20 border-4 border-purple-500 rounded-full border-t-transparent border-r-transparent animate-spin absolute top-0 left-0" style={{ animationDuration: '1.5s' }}></div>
      </div>
      <p className="mt-6 text-lg font-medium text-gray-700">{message}</p>
      <p className="mt-2 text-sm text-gray-500">预计需要10秒左右，请耐心等待</p>
    </div>
  );
};

export default LoadingSpinner;