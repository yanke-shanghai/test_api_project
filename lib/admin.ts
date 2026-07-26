import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from './auth';

/**
 * 校验管理员权限
 * 用于所有 /api/admin/* 接口
 *
 * 返回:
 * - 鉴权成功: { authorized: true, userId, email }
 * - 鉴权失败: { authorized: false, response: NextResponse }
 */
export function verifyAdmin(request: NextRequest): {
  authorized: boolean;
  userId?: string;
  email?: string;
  response?: NextResponse;
} {
  // 1. 检查 Authorization Header
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      authorized: false,
      response: NextResponse.json(
        { success: false, error: '未授权，请登录' },
        { status: 401 }
      ),
    };
  }

  // 2. 验证 JWT Token
  const token = authHeader.slice(7);
  const decoded = verifyToken(token);
  if (!decoded) {
    return {
      authorized: false,
      response: NextResponse.json(
        { success: false, error: '无效的 Token' },
        { status: 401 }
      ),
    };
  }

  // 3. 校验管理员权限
  if (!decoded.isAdmin) {
    return {
      authorized: false,
      response: NextResponse.json(
        { success: false, error: '无管理员权限' },
        { status: 403 }
      ),
    };
  }

  return {
    authorized: true,
    userId: decoded.sub,
    email: decoded.email,
  };
}
