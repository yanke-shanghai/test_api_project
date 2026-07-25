'use client';

import { useState, useCallback } from 'react';
import { Sparkles, Shirt, ArrowRight } from 'lucide-react';
import ImageUploader from '../components/ImageUploader';
import LoadingSpinner from '../components/LoadingSpinner';
import ResultDisplay from '../components/ResultDisplay';
import Header from '../components/Header';

type Status = 'upload' | 'loading' | 'result' | 'error';

export default function Home() {
  const [personImage, setPersonImage] = useState<File | null>(null);
  const [clothingImage, setClothingImage] = useState<File | null>(null);
  const [status, setStatus] = useState<Status>('upload');
  const [resultUrl, setResultUrl] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [personError, setPersonError] = useState<string>('');
  const [clothingError, setClothingError] = useState<string>('');

  const handleStartTryOn = useCallback(async () => {
    if (!personImage || !clothingImage) {
      console.error('[Frontend] 缺少人像照片或服装照片');
      setErrorMessage('请上传人像照片和服装照片');
      return;
    }

    console.log('[Frontend] 开始换衣流程');
    console.log('[Frontend] 人像照片:', personImage.name, personImage.size, 'bytes');
    console.log('[Frontend] 服装照片:', clothingImage.name, clothingImage.size, 'bytes');

    setErrorMessage('');
    setStatus('loading');

    try {
      const formData = new FormData();
      formData.append('personImage', personImage);
      formData.append('clothingImage', clothingImage);

      console.log('[Frontend] 准备发送请求到 /api/try-on');

      // 设置前端超时（60秒）
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.error('[Frontend] 请求超时，取消请求');
        controller.abort();
      }, 60000);

      const response = await fetch('/api/try-on', {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      console.log('[Frontend] 收到响应，状态码:', response.status);

      if (!response.ok) {
        console.error('[Frontend] HTTP 错误:', response.status);
        const errorData = await response.json();
        console.error('[Frontend] 错误详情:', errorData);
        setErrorMessage(errorData.error || `HTTP ${response.status} 错误`);
        setStatus('error');
        return;
      }

      const data = await response.json();
      console.log('[Frontend] 响应数据:', data);

      if (data.success) {
        console.log('[Frontend] 换衣成功:', data.resultUrl);
        setResultUrl(data.resultUrl);
        setStatus('result');
      } else {
        console.error('[Frontend] 换衣失败:', data.error);
        setErrorMessage(data.error || '换衣失败，请重试');
        setStatus('error');
      }
    } catch (error: any) {
      console.error('[Frontend] 换衣请求异常:', error);
      if (error.name === 'AbortError') {
        console.error('[Frontend] 请求超时');
        setErrorMessage('请求超时，请重试');
      } else {
        console.error('[Frontend] 错误详情:', error.message, error.stack);
        setErrorMessage('换衣失败，请重试');
      }
      setStatus('error');
    }
  }, [personImage, clothingImage]);

  const handleRetry = useCallback(() => {
    handleStartTryOn();
  }, [handleStartTryOn]);

  const handleReupload = useCallback(() => {
    setPersonImage(null);
    setClothingImage(null);
    setResultUrl('');
    setErrorMessage('');
    setPersonError('');
    setClothingError('');
    setStatus('upload');
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
      {/* Header */}
      <Header />

      {/* Subtitle */}
      <div className="text-center py-4">
        <p className="text-gray-500 text-sm md:text-base">
          上传你的照片和喜欢的衣服，AI帮你一键试穿
        </p>
      </div>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {status === 'upload' && (
          <div className="space-y-8">
            {/* Upload Section */}
            <div className="grid md:grid-cols-2 gap-8">
              <ImageUploader
                label="人像照片"
                type="person"
                value={personImage}
                onChange={setPersonImage}
                onError={setPersonError}
                error={personError}
              />
              <ImageUploader
                label="服装照片"
                type="clothing"
                value={clothingImage}
                onChange={setClothingImage}
                onError={setClothingError}
                error={clothingError}
              />
            </div>

            {/* Start Button */}
            <div className="flex justify-center">
              <button
                onClick={handleStartTryOn}
                disabled={!personImage || !clothingImage}
                className={`flex items-center gap-3 px-8 py-4 rounded-full font-bold text-lg transition-all duration-300 shadow-lg ${
                  personImage && clothingImage
                    ? 'bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 text-white hover:from-pink-600 hover:via-purple-600 hover:to-blue-600 hover:shadow-xl hover:scale-105'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                <Sparkles size={24} />
                开始换衣
                <ArrowRight size={24} />
              </button>
            </div>

            {/* Tips */}
            <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 mt-8">
              <h3 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
                <Shirt size={20} className="text-pink-500" />
                使用小贴士
              </h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="text-pink-500 font-bold">•</span>
                  人像照片建议上传全身照，效果更好
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-500 font-bold">•</span>
                  服装照片背景清晰，更容易识别
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 font-bold">•</span>
                  支持上衣、裤子、连衣裙、外套等各类服装
                </li>
              </ul>
            </div>
          </div>
        )}

        {status === 'loading' && <LoadingSpinner />}

        {status === 'result' && resultUrl && (
          <ResultDisplay
            imageUrl={resultUrl}
            onRetry={handleRetry}
            onReupload={handleReupload}
          />
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center py-12">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
              <span className="text-4xl">😢</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">换衣失败</h3>
            <p className="text-gray-500 mb-6">{errorMessage}</p>
            <div className="flex gap-4">
              <button
                onClick={handleRetry}
                className="flex items-center gap-2 bg-gray-100 text-gray-700 px-6 py-3 rounded-full font-semibold hover:bg-gray-200 transition-all duration-300"
              >
                重试
              </button>
              <button
                onClick={handleReupload}
                className="flex items-center gap-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white px-6 py-3 rounded-full font-semibold hover:from-pink-600 hover:to-purple-600 transition-all duration-300"
              >
                重新上传
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="py-6 px-4 text-center text-gray-400 text-sm">
        <p>AI试衣魔法 - 让穿搭更有趣</p>
      </footer>
    </div>
  );
}