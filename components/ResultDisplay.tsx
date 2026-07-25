'use client';

import React from 'react';
import { Download, RotateCcw, ArrowLeft } from 'lucide-react';

interface ResultDisplayProps {
  imageUrl: string;
  onRetry: () => void;
  onReupload: () => void;
}

const ResultDisplay: React.FC<ResultDisplayProps> = ({
  imageUrl,
  onRetry,
  onReupload,
}) => {
  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `ai-tryon-${Date.now()}.png`;
    link.click();
  };

  return (
    <div className="flex flex-col items-center">
      <div className="w-full max-w-lg">
        <div className="relative rounded-2xl overflow-hidden shadow-2xl border-4 border-pink-100">
          <img
            src={imageUrl}
            alt="换衣结果"
            className="w-full h-auto object-contain"
          />
          <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full">
            <span className="text-sm font-semibold text-pink-600">AI换衣完成</span>
          </div>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap justify-center gap-4">
        <button
          onClick={handleDownload}
          className="flex items-center gap-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white px-6 py-3 rounded-full font-semibold hover:from-pink-600 hover:to-purple-600 transition-all duration-300 shadow-lg hover:shadow-xl"
        >
          <Download size={20} />
          下载图片
        </button>

        <button
          onClick={onRetry}
          className="flex items-center gap-2 bg-gray-100 text-gray-700 px-6 py-3 rounded-full font-semibold hover:bg-gray-200 transition-all duration-300"
        >
          <RotateCcw size={20} />
          重试
        </button>

        <button
          onClick={onReupload}
          className="flex items-center gap-2 bg-white border-2 border-pink-500 text-pink-500 px-6 py-3 rounded-full font-semibold hover:bg-pink-50 transition-all duration-300"
        >
          <ArrowLeft size={20} />
          重新上传
        </button>
      </div>
    </div>
  );
};

export default ResultDisplay;