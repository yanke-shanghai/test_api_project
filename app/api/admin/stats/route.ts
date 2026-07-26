import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/app/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { verifyAdmin } from '@/lib/admin';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL || '' });
const prisma = new PrismaClient({ adapter });

/**
 * 概览统计数据 API
 * GET /api/admin/stats
 *
 * 返回: 用户总数、最近7天新增用户、任务总数、最近7天任务、任务状态分布
 */
export async function GET(request: NextRequest) {
  // 鉴权
  const auth = verifyAdmin(request);
  if (!auth.authorized) {
    return auth.response!;
  }

  try {
    // 7天前的时间
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // 并行查询所有数据
    const [totalUsers, newUsers7d, totalTasks, newTasks7d, taskStatusDistribution] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({
        where: { createdAt: { gte: sevenDaysAgo } },
      }),
      prisma.tryOnRecord.count(),
      prisma.tryOnRecord.count({
        where: { createdAt: { gte: sevenDaysAgo } },
      }),
      prisma.tryOnRecord.groupBy({
        by: ['status'],
        _count: { status: true },
      }),
    ]);

    // 格式化状态分布
    const distribution = taskStatusDistribution.map((item) => ({
      status: item.status,
      count: item._count.status,
    }));

    return NextResponse.json({
      success: true,
      data: {
        totalUsers,
        newUsers7d,
        totalTasks,
        newTasks7d,
        taskStatusDistribution: distribution,
      },
    });
  } catch (error: any) {
    console.error('[Admin Stats API] 查询错误:', error);
    return NextResponse.json(
      { success: false, error: error.message || '查询失败' },
      { status: 500 }
    );
  }
}
