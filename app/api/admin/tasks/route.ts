import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/app/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { verifyAdmin } from '@/lib/admin';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL || '' });
const prisma = new PrismaClient({ adapter });

// 允许的任务状态
const ALLOWED_STATUSES = ['processing', 'completed', 'failed'];

/**
 * 任务管理列表 API
 * GET /api/admin/tasks?page=1&limit=10&search=xxx&status=all
 */
export async function GET(request: NextRequest) {
  // 鉴权
  const auth = verifyAdmin(request);
  if (!auth.authorized) {
    return auth.response!;
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 100);
    const skip = (page - 1) * limit;
    const search = searchParams.get('search') || '';
    const statusFilter = searchParams.get('status') || 'all';

    // 构建查询条件
    const where: any = {};
    if (search) {
      where.user = {
        email: { contains: search, mode: 'insensitive' },
      };
    }
    if (statusFilter !== 'all' && ALLOWED_STATUSES.includes(statusFilter)) {
      where.status = statusFilter;
    }

    // 查询总数和列表（关联用户信息）
    const [total, tasks] = await Promise.all([
      prisma.tryOnRecord.count({ where }),
      prisma.tryOnRecord.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: tasks,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('[Admin Tasks API] 查询错误:', error);
    return NextResponse.json(
      { success: false, error: error.message || '查询失败' },
      { status: 500 }
    );
  }
}
