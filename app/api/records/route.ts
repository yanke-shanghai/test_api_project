import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/app/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { verifyToken } from '@/lib/auth';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL || '' });
const prisma = new PrismaClient({ adapter });

/**
 * 查询换衣历史记录列表
 * 需要登录认证（JWT Token）
 *
 * 请求参数:
 * - Authorization: Bearer <JWT Token>
 * - page: number (默认 1)
 * - limit: number (默认 10, 最大 100)
 *
 * 响应:
 * - success: boolean
 * - data: TryOnRecord[]
 * - pagination: { page, limit, total, totalPages }
 */
export async function GET(request: NextRequest) {
  try {
    // 验证 JWT Token
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: '未授权，请登录' },
        { status: 401 }
      );
    }

    const token = authHeader.slice(7);
    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { success: false, error: '无效的 Token' },
        { status: 401 }
      );
    }

    const userId = decoded.sub;

    // 获取分页参数
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 100);
    const skip = (page - 1) * limit;

    // 查询记录总数
    const total = await prisma.tryOnRecord.count({
      where: { userId },
    });

    // 查询记录列表（按创建时间倒序）
    const records = await prisma.tryOnRecord.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });

    return NextResponse.json({
      success: true,
      data: records,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('[Records API] 查询错误:', error);
    return NextResponse.json(
      { success: false, error: error.message || '查询失败，请重试' },
      { status: 500 }
    );
  }
}
