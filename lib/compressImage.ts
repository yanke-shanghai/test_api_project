/**
 * 图片压缩工具
 * 使用 Canvas API 压缩图片，无需额外依赖
 * 目标：将图片压缩到 1.5MB 以内，确保 Base64 后不超过 Vercel 4.5MB 限制
 */

export interface CompressOptions {
  /** 最大宽度/高度（像素），默认 1920 */
  maxSize?: number;
  /** JPEG 质量（0-1），默认 0.8 */
  quality?: number;
  /** 目标文件大小（字节），默认 1.5MB */
  targetSize?: number;
}

/**
 * 压缩图片文件
 * @param file - 原始图片文件
 * @param options - 压缩选项
 * @returns 压缩后的 Blob
 */
export async function compressImage(
  file: File,
  options: CompressOptions = {}
): Promise<Blob> {
  const {
    maxSize = 1920,
    quality = 0.8,
    targetSize = 1.5 * 1024 * 1024, // 1.5MB
  } = options;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();

      img.onload = () => {
        // 计算缩放比例
        let width = img.width;
        let height = img.height;

        if (width > maxSize || height > maxSize) {
          const ratio = Math.min(maxSize / width, maxSize / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        // 创建 Canvas 并绘制
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('无法获取 Canvas 上下文'));
          return;
        }

        // 白色背景（避免 PNG 透明背景变黑）
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);

        ctx.drawImage(img, 0, 0, width, height);

        // 尝试压缩到目标大小
        let currentQuality = quality;
        const tryCompress = () => {
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('图片压缩失败'));
                return;
              }

              // 如果仍然太大且质量还可以降低，继续压缩
              if (blob.size > targetSize && currentQuality > 0.5) {
                currentQuality -= 0.1;
                tryCompress();
              } else {
                resolve(blob);
              }
            },
            'image/jpeg',
            currentQuality
          );
        };

        tryCompress();
      };

      img.onerror = () => {
        reject(new Error('图片加载失败'));
      };

      img.src = e.target?.result as string;
    };

    reader.onerror = () => {
      reject(new Error('文件读取失败'));
    };

    reader.readAsDataURL(file);
  });
}

/**
 * 将 Blob 转换为 File
 */
export function blobToFile(blob: Blob, fileName: string): File {
  return new File([blob], fileName, {
    type: 'image/jpeg',
    lastModified: Date.now(),
  });
}
