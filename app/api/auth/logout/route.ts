import { NextResponse } from 'next/server';

export async function POST() {
  console.log('[Auth API] 登出请求');

  // 当前阶段为 MOCK 模式，登出逻辑在前端处理
  // 后续接入数据库时可在此添加服务端清理逻辑（如清除 Session、Token 等）

  return NextResponse.json({
    success: true,
    message: '已退出登录',
  });
}
