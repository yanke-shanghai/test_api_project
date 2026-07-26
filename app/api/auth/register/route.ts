import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/app/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { hashPassword } from '@/lib/auth';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL || '' });
const prisma = new PrismaClient({ adapter });

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    console.log('[Auth API] 注册请求:', { email });

    // 验证参数
    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: '请输入邮箱和密码' },
        { status: 400 }
      );
    }

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: '请输入有效的邮箱地址' },
        { status: 400 }
      );
    }

    // 验证密码长度
    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: '密码至少6位' },
        { status: 400 }
      );
    }

    // 检查邮箱是否已注册
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: '该邮箱已注册' },
        { status: 400 }
      );
    }

    // 使用 bcrypt 加密密码
    const passwordHash = await hashPassword(password);

    // 创建用户到数据库
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
      },
    });

    console.log('[Auth API] 注册成功:', { email, userId: user.id });

    return NextResponse.json({
      success: true,
      message: '注册成功',
    });
  } catch (error: any) {
    console.error('[Auth API] 注册错误:', error);
    console.error('[Auth API] 错误详情:', error.message, error.stack);
    return NextResponse.json(
      { success: false, error: error.message || '注册失败，请重试' },
      { status: 500 }
    );
  }
}
