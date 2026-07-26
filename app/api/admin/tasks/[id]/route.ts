import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/app/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { verifyAdmin } from '@/lib/admin';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL || '' });
const prisma = new PrismaClient({ adapter });

// 允许的任务状态
const ALLOWED_STATUSES = ['processing', 'completed', 'failed'];

/**
 * 任务详情 API
 * GET /api/admin/tasks/[id]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // 鉴权
  const auth = verifyAdmin(request);
  if (!auth.authorized) {
    return auth.response!;
  }

  try {
    const { id } = params;

    const task = await prisma.tryOnRecord.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });

    if (!task) {
      return NextResponse.json(
        { success: false, error: '任务不存在' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: task,
    });
  } catch (error: any) {
    console.error('[Admin Tasks API] 查询详情错误:', error);
    return NextResponse.json(
      { success: false, error: error.message || '查询失败' },
      { status: 500 }
    );
  }
}

/**
 * 编辑任务状态 API
 * PATCH /api/admin/tasks/[id]
 * Body: { status: "processing" | "completed" | "failed" }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // 鉴权
  const auth = verifyAdmin(request);
  if (!auth.authorized) {
    return auth.response!;
  }

  try {
    const { id } = params;
    const body = await request.json();
    const { status } = body;

    // 校验状态值
    if (!ALLOWED_STATUSES.includes(status)) {
      return NextResponse.json(
        { success: false, error: `无效的状态值，允许：${ALLOWED_STATUSES.join(' / ')}` },
        { status: 400 }
      );
    }

    // 检查任务是否存在
    const existingTask = await prisma.tryOnRecord.findUnique({ where: { id } });
    if (!existingTask) {
      return NextResponse.json(
        { success: false, error: '任务不存在' },
        { status: 404 }
      );
    }

    // 更新任务状态
    const updatedTask = await prisma.tryOnRecord.update({
      where: { id },
      data: { status },
      select: {
        id: true,
        status: true,
        createdAt: true,
      },
    });

    console.log('[Admin Tasks API] 更新任务状态:', { id, status });

    return NextResponse.json({
      success: true,
      data: updatedTask,
    });
  } catch (error: any) {
    console.error('[Admin Tasks API] 更新错误:', error);
    return NextResponse.json(
      { success: false, error: error.message || '更新失败' },
      { status: 500 }
    );
  }
}
