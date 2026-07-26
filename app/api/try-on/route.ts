import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/app/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { arkService } from '../../../services/arkService';
import { ArkServiceError } from '../../../types/ark';
import { verifyToken } from '@/lib/auth';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL || '' });
const prisma = new PrismaClient({ adapter });

/**
 * AI试衣API路由
 *
 * 使用 Ark API (doubao-seedream-5-0-260128 模型) 实现图片换衣功能
 * 需要登录认证（JWT Token）
 *
 * 请求参数:
 * - personImage: 人像照片 (File, JPG/PNG, 最大10MB)
 * - clothingImage: 服装照片 (File, JPG/PNG, 最大10MB)
 * - Authorization: Bearer <JWT Token>
 *
 * 响应:
 * - success: boolean
 * - resultUrl: string (生成的换衣图片URL)
 * - recordId: string (记录ID)
 * - message: string
 * - error: string (失败时)
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  console.log('[API] ==================== 请求开始 ====================');
  console.log('[API] /api/try-on 接收到请求');
  console.log('[API] 请求时间:', new Date().toISOString());

  try {
    // 验证 JWT Token
    console.log('[API] 步骤0: 验证 JWT Token');
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('[API] 未授权: 缺少 Authorization Header');
      return NextResponse.json(
        { success: false, error: '未授权，请登录' },
        { status: 401 }
      );
    }

    const token = authHeader.slice(7);
    const decoded = verifyToken(token);
    if (!decoded) {
      console.error('[API] 未授权: 无效的 Token');
      return NextResponse.json(
        { success: false, error: '无效的 Token' },
        { status: 401 }
      );
    }

    const userId = decoded.sub;
    console.log('[API] Token 验证成功:', { userId });
    console.log('[API] 步骤0完成: 耗时', Date.now() - startTime, 'ms');

    console.log('[API] 步骤1: 解析 FormData');
    const formData = await request.formData();
    const personImage = formData.get('personImage') as File;
    const clothingImage = formData.get('clothingImage') as File;

    console.log('[API] 步骤1完成: 耗时', Date.now() - startTime, 'ms');
    console.log('[API] 接收到文件:', {
      personImage: personImage ? `${personImage.name} (${personImage.size} bytes)` : 'null',
      clothingImage: clothingImage ? `${clothingImage.name} (${clothingImage.size} bytes)` : 'null',
    });

    // 验证文件存在
    if (!personImage || !clothingImage) {
      console.error('[API] 文件验证失败: 缺少人像照片或服装照片');
      return NextResponse.json(
        { success: false, error: '请上传人像照片和服装照片' },
        { status: 400 }
      );
    }

    // 验证文件类型
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!validTypes.includes(personImage.type) || !validTypes.includes(clothingImage.type)) {
      console.error('[API] 文件验证失败: 不支持的文件格式', {
        personImageType: personImage.type,
        clothingImageType: clothingImage.type,
      });
      return NextResponse.json(
        { success: false, error: '仅支持JPG/JPEG和PNG格式' },
        { status: 400 }
      );
    }

    // 验证文件大小 (10MB)
    const maxSize = 10 * 1024 * 1024;
    if (personImage.size > maxSize || clothingImage.size > maxSize) {
      console.error('[API] 文件验证失败: 文件大小超过限制', {
        personImageSize: personImage.size,
        clothingImageSize: clothingImage.size,
        maxSize,
      });
      return NextResponse.json(
        { success: false, error: '图片大小不能超过10MB' },
        { status: 400 }
      );
    }

    // 将图片转换为 Base64 data URI
    console.log('[API] 步骤2: 开始将图片转换为 Base64');

    const personArrayBuffer = await personImage.arrayBuffer();
    const clothingArrayBuffer = await clothingImage.arrayBuffer();

    const personBase64 = `data:${personImage.type};base64,${Buffer.from(personArrayBuffer).toString('base64')}`;
    const clothingBase64 = `data:${clothingImage.type};base64,${Buffer.from(clothingArrayBuffer).toString('base64')}`;

    console.log('[API] 步骤2完成: 耗时', Date.now() - startTime, 'ms');
    console.log('[API] 人像图片 Base64 长度:', personBase64.length, 'chars');
    console.log('[API] 服装图片 Base64 长度:', clothingBase64.length, 'chars');
    console.log('[API] 图片转换完成，准备调用 Ark API');

    // 调用 Ark API 生成换衣图片
    console.log('[API] 步骤3: 调用 Ark API');
    const resultUrl = await arkService.generateImage(personBase64, clothingBase64);

    console.log('[API] 步骤3完成: 耗时', Date.now() - startTime, 'ms');
    console.log('[API] 换衣成功:', resultUrl);

    // 保存换衣记录到数据库
    console.log('[API] 步骤4: 保存换衣记录到数据库');
    const record = await prisma.tryOnRecord.create({
      data: {
        userId,
        personImageUrl: personBase64,
        clothingImageUrl: clothingBase64,
        resultImageUrl: resultUrl,
        status: 'success',
      },
    });

    console.log('[API] 步骤4完成: 耗时', Date.now() - startTime, 'ms');
    console.log('[API] 记录保存成功:', { recordId: record.id });
    console.log('[API] ==================== 请求结束 ====================');
    console.log('[API] 总耗时:', Date.now() - startTime, 'ms');

    return NextResponse.json({
      success: true,
      resultUrl,
      recordId: record.id,
      message: '换衣成功',
    });

  } catch (error) {
    console.error('[API] ==================== 请求异常 ====================');
    console.error('[API] 换衣处理错误:', error);
    console.error('[API] 已耗时:', Date.now() - startTime, 'ms');

    // 处理 ArkServiceError
    if (error instanceof ArkServiceError) {
      console.error('[API] ArkServiceError:', {
        message: error.message,
        code: error.code,
        statusCode: error.statusCode,
      });

      let statusCode = 500;
      if (error.statusCode) {
        statusCode = error.statusCode;
      } else if (error.code === 'TIMEOUT') {
        statusCode = 504;
      } else if (error.code === 'CONFIG_ERROR') {
        statusCode = 500;
      }

      return NextResponse.json(
        { success: false, error: error.message },
        { status: statusCode }
      );
    }

    // 处理其他未知错误
    console.error('[API] 未知错误详情:', error);
    return NextResponse.json(
      { success: false, error: '换衣失败，请重试' },
      { status: 500 }
    );
  }
}
