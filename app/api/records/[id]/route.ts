import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/app/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { verifyToken } from '@/lib/auth';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL || '' });
const prisma = new PrismaClient({ adapter });

/**
 * 查询单条换衣记录
 * 需要登录认证（JWT Token）
 * 只能查询自己的记录
 *
 * 请求参数:
 * - Authorization: Bearer <JWT Token>
 * - id: string (记录ID)
 *
 * 响应:
 * - success: boolean
 * - data: TryOnRecord | null
 */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
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
    const recordId = params.id;

    // 查询记录
    const record = await prisma.tryOnRecord.findUnique({
      where: { id: recordId },
    });

    // 验证记录是否存在
    if (!record) {
      return NextResponse.json(
        { success: false, error: '记录不存在' },
        { status: 404 }
      );
    }

    // 验证用户权限（只能查询自己的记录）
    if (record.userId !== userId) {
      return NextResponse.json(
        { success: false, error: '无权访问该记录' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: record,
    });
  } catch (error: any) {
    console.error('[Records API] 查询错误:', error);
    return NextResponse.json(
      { success: false, error: error.message || '查询失败，请重试' },
      { status: 500 }
    );
  }
}
