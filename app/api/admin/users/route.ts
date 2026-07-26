import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/app/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { verifyAdmin } from '@/lib/admin';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL || '' });
const prisma = new PrismaClient({ adapter });

/**
 * 用户管理列表 API
 * GET /api/admin/users?page=1&limit=10&search=xxx&isAdmin=all
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
    const isAdminFilter = searchParams.get('isAdmin') || 'all';

    // 构建查询条件
    const where: any = {};
    if (search) {
      where.email = { contains: search, mode: 'insensitive' };
    }
    if (isAdminFilter === 'true') {
      where.isAdmin = true;
    } else if (isAdminFilter === 'false') {
      where.isAdmin = false;
    }

    // 查询总数和列表
    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          isAdmin: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('[Admin Users API] 查询错误:', error);
    return NextResponse.json(
      { success: false, error: error.message || '查询失败' },
      { status: 500 }
    );
  }
}
