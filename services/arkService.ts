import {
  ArkImageGenerationRequest,
  ArkImageGenerationResponse,
  ArkErrorResponse,
  ArkServiceError,
} from '../types/ark';

/**
 * Ark API 服务封装
 * 提供图片生成（换衣）功能
 */
class ArkService {
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly timeout: number;

  constructor() {
    this.baseUrl = process.env.ARK_API_BASE_URL || 'https://ark.cn-beijing.volces.com/api/v3';
    this.apiKey = process.env.ARK_API_KEY || '';
    this.timeout = parseInt(process.env.ARK_API_TIMEOUT || '30000', 10);

    console.log('[ArkService] 初始化完成');
    console.log('[ArkService] Base URL:', this.baseUrl);
    console.log('[ArkService] API Key configured:', this.apiKey ? 'Yes' : 'No');
    console.log('[ArkService] Timeout:', this.timeout, 'ms');
  }

  /**
   * 生成图片（换衣）
   * @param personImageBase64 - 人像图片 Base64 data URI
   * @param clothingImageBase64 - 服装图片 Base64 data URI
   * @returns 生成的图片 URL
   */
  async generateImage(
    personImageBase64: string,
    clothingImageBase64: string
  ): Promise<string> {
    const startTime = Date.now();
    console.log('[ArkService] ──────────────────────────────────');
    console.log('[ArkService] 开始调用图片生成 API');
    console.log('[ArkService] 当前时间:', new Date().toISOString());
    console.log('[ArkService] 人像图片大小:', personImageBase64.length, 'chars');
    console.log('[ArkService] 服装图片大小:', clothingImageBase64.length, 'chars');
    console.log('[ArkService] 超时设置:', this.timeout, 'ms');

    // 验证 API Key
    if (!this.apiKey) {
      console.error('[ArkService] API Key 未配置');
      throw new ArkServiceError('ARK_API_KEY 未配置', 'CONFIG_ERROR');
    }

    const requestBody: ArkImageGenerationRequest = {
      model: 'doubao-seedream-5-0-260128',
      prompt: '将图1的服装换为图2的服装',
      image: [personImageBase64, clothingImageBase64],
      sequential_image_generation: 'disabled',
      response_format: 'url',
      size: '2K',
      stream: false,
      watermark: false,
    };

    console.log('[ArkService] 请求参数:', JSON.stringify({
      ...requestBody,
      image: ['[base64-image-1]', '[base64-image-2]'],
    }));

    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.error('[ArkService] ⚠️ 请求超时，取消请求');
      controller.abort();
    }, this.timeout);

    try {
      console.log('[ArkService] 正在发送请求到:', `${this.baseUrl}/images/generations`);
      
      const response = await fetch(`${this.baseUrl}/images/generations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      console.log('[ArkService] 请求耗时:', Date.now() - startTime, 'ms');
      console.log('[ArkService] HTTP 状态码:', response.status);

      if (!response.ok) {
        const errorData = (await response.json()) as ArkErrorResponse;
        const errorMessage = errorData.error?.message || `HTTP ${response.status}`;
        const errorCode = errorData.error?.code || 'UNKNOWN_ERROR';

        console.error('[ArkService] ❌ API 调用失败:', errorCode, '-', errorMessage);

        if (response.status === 401) {
          throw new ArkServiceError('API授权失败，请联系管理员', 'UNAUTHORIZED', 401);
        } else if (response.status === 429) {
          throw new ArkServiceError('请求过于频繁，请稍后再试', 'RATE_LIMITED', 429);
        } else {
          throw new ArkServiceError(errorMessage, errorCode, response.status);
        }
      }

      const data = (await response.json()) as ArkImageGenerationResponse;
      console.log('[ArkService] ✅ API 调用成功');
      console.log('[ArkService] 返回数据:', JSON.stringify(data));

      if (!data.data || data.data.length === 0) {
        console.error('[ArkService] ❌ API 返回空数据');
        throw new ArkServiceError('API 返回空数据', 'EMPTY_RESPONSE');
      }

      console.log('[ArkService] 总耗时:', Date.now() - startTime, 'ms');
      console.log('[ArkService] ──────────────────────────────────');

      return data.data[0].url;
    } catch (error) {
      clearTimeout(timeoutId);
      console.error('[ArkService] ⚠️ 请求异常，已耗时:', Date.now() - startTime, 'ms');

      if (error instanceof ArkServiceError) {
        console.error('[ArkService] ArkServiceError:', error.code, '-', error.message);
        throw error;
      }

      if (error instanceof DOMException && error.name === 'AbortError') {
        console.error('[ArkService] ❌ 请求超时（超过', this.timeout / 1000, '秒）');
        throw new ArkServiceError('请求超时，请重试', 'TIMEOUT');
      }

      console.error('[ArkService] ❌ 未知错误:', error);
      if (error instanceof Error) {
        console.error('[ArkService] 错误详情:', error.message, error.stack);
      }
      throw new ArkServiceError('调用 Ark API 时发生错误', 'UNKNOWN_ERROR');
    }
  }
}

// 创建单例实例
export const arkService = new ArkService();

export default ArkService;
