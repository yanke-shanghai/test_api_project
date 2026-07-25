'use client';

import React, { useState, useCallback } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';

interface ImageUploaderProps {
  label: string;
  type: 'person' | 'clothing';
  value: File | null;
  onChange: (file: File | null) => void;
  onError?: (error: string) => void;
  error?: string;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({
  label,
  type,
  value,
  onChange,
  onError,
  error,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  React.useEffect(() => {
    if (value) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(value);
    } else {
      setPreview(null);
    }
  }, [value]);

  const validateFile = useCallback((file: File): string | null => {
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return '图片大小不能超过10MB';
    }
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!validTypes.includes(file.type)) {
      return '仅支持JPG/JPEG和PNG格式';
    }
    return null;
  }, []);

  const handleFileChange = useCallback(
    (file: File) => {
      const validationError = validateFile(file);
      if (validationError) {
        onChange(null);
        onError?.(validationError);
      } else {
        onChange(file);
        onError?.('');
      }
    },
    [validateFile, onChange, onError]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) {
        handleFileChange(file);
      }
    },
    [handleFileChange]
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFileChange(file);
      }
    },
    [handleFileChange]
  );

  const handleRemove = useCallback(() => {
    onChange(null);
    setPreview(null);
  }, [onChange]);

  return (
    <div className="flex flex-col items-center">
      <label className="text-lg font-semibold text-gray-700 mb-3">
        {label}
      </label>
      <div
        className={`w-full max-w-md h-48 border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all duration-300 ${
          isDragging
            ? 'border-pink-500 bg-pink-50'
            : value
            ? 'border-green-400 bg-green-50'
            : 'border-gray-300 bg-gray-50 hover:border-pink-400 hover:bg-pink-50'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => document.getElementById(`file-input-${type}`)?.click()}
      >
        <input
          id={`file-input-${type}`}
          type="file"
          accept="image/jpeg,image/jpg,image/png"
          onChange={handleFileSelect}
          className="hidden"
        />
        {preview ? (
          <div className="relative w-full h-full rounded-xl overflow-hidden">
            <img
              src={preview}
              alt={`${label}预览`}
              className="w-full h-full object-contain"
            />
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleRemove();
              }}
              className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        ) : (
          <>
            <Upload
              size={48}
              className={`mb-3 ${
                isDragging ? 'text-pink-500' : 'text-gray-400'
              }`}
            />
            <p className="text-gray-500 text-sm text-center px-4">
              拖拽图片到此处或点击选择文件
            </p>
            <p className="text-gray-400 text-xs mt-2">
              支持 JPG/JPEG、PNG 格式，最大 10MB
            </p>
          </>
        )}
      </div>
      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
      {preview && (
        <div className="mt-2 flex items-center gap-2">
          <ImageIcon size={16} className="text-green-500" />
          <span className="text-sm text-green-600">已上传 {value?.name}</span>
        </div>
      )}
    </div>
  );
};

export default ImageUploader;