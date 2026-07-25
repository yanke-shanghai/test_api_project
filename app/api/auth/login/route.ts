import { NextRequest, NextResponse } from 'next/server';

// 共享用户数据存储（全局变量，同一服务器实例内共享）
declare global {
  var mockUsers: Array<{ email: string; password: string }>;
}

// 初始化用户存储
if (!global.mockUsers) {
  global.mockUsers = [];
}

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
    const user = global.mockUsers.find((u) => u.email === email);

    // 验证用户是否存在
    if (!user) {
      return NextResponse.json(
        { success: false, error: '邮箱或密码错误' },
        { status: 400 }
      );
    }

    // 验证密码（当前阶段明文比较，后续接入数据库时加密）
    if (user.password !== password) {
      return NextResponse.json(
        { success: false, error: '邮箱或密码错误' },
        { status: 400 }
      );
    }

    console.log('[Auth API] 登录成功:', { email });

    return NextResponse.json({
      success: true,
      user: { email },
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
