// Ark API 请求类型
export interface ArkImageGenerationRequest {
  model: string;
  prompt: string;
  image: string[]; // 支持 URL 或 data:image/<格式>;base64,...
  sequential_image_generation?: 'enabled' | 'disabled';
  response_format?: 'url' | 'b64_json';
  size?: string;
  stream?: boolean;
  watermark?: boolean;
}

// Ark API 响应类型
export interface ArkImageGenerationResponse {
  model: string;
  created: number;
  data: ArkImageData[];
  usage?: ArkUsage;
}

export interface ArkImageData {
  url: string;
  size: string;
}

export interface ArkUsage {
  generated_images: number;
  output_tokens: number;
  total_tokens: number;
}

// Ark API 错误响应类型
export interface ArkErrorResponse {
  error: {
    code: string;
    message: string;
    param?: string;
    type?: string;
  };
}

// 自定义错误类
export class ArkServiceError extends Error {
  constructor(
    public message: string,
    public code: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = 'ArkServiceError';
  }
}
