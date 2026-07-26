import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/app/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { comparePassword, generateToken } from '@/lib/auth';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL || '' });
const prisma = new PrismaClient({ adapter });

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    console.log('[Auth API] 登录请求:', { email });

    // 验证参数
    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: '请输入邮箱和密码' },
        { status: 400 }
      );
    }

    // 查找用户
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // 验证用户是否存在
    if (!user) {
      return NextResponse.json(
        { success: false, error: '邮箱或密码错误' },
        { status: 400 }
      );
    }

    // 使用 bcrypt 验证密码
    const isPasswordValid = await comparePassword(password, user.passwordHash);
    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, error: '邮箱或密码错误' },
        { status: 400 }
      );
    }

    // 生成 JWT Token
    const token = generateToken(user.id, user.email);

    console.log('[Auth API] 登录成功:', { email, userId: user.id });

    return NextResponse.json({
      success: true,
      user: { id: user.id, email: user.email },
      token,
    });
  } catch (error: any) {
    console.error('[Auth API] 登录错误:', error);
    console.error('[Auth API] 错误详情:', error.message, error.stack);
    return NextResponse.json(
      { success: false, error: error.message || '登录失败，请重试' },
      { status: 500 }
    );
  }
}
