import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/app/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { verifyAdmin } from '@/lib/admin';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL || '' });
const prisma = new PrismaClient({ adapter });

/**
 * 编辑用户 isAdmin 字段
 * PATCH /api/admin/users/[id]
 * Body: { isAdmin: boolean }
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
    const { isAdmin } = body;

    // 校验参数
    if (typeof isAdmin !== 'boolean') {
      return NextResponse.json(
        { success: false, error: 'isAdmin 必须是布尔值' },
        { status: 400 }
      );
    }

    // 检查用户是否存在
    const existingUser = await prisma.user.findUnique({ where: { id } });
    if (!existingUser) {
      return NextResponse.json(
        { success: false, error: '用户不存在' },
        { status: 404 }
      );
    }

    // 更新用户
    const updatedUser = await prisma.user.update({
      where: { id },
      data: { isAdmin },
      select: {
        id: true,
        email: true,
        isAdmin: true,
        createdAt: true,
      },
    });

    console.log('[Admin Users API] 更新用户权限:', { id, isAdmin });

    return NextResponse.json({
      success: true,
      data: updatedUser,
    });
  } catch (error: any) {
    console.error('[Admin Users API] 更新错误:', error);
    return NextResponse.json(
      { success: false, error: error.message || '更新失败' },
      { status: 500 }
    );
  }
}
