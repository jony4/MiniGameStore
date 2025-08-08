import { NextRequest } from 'next/server';

// 管理员认证配置
const ADMIN_SECRET = process.env.ADMIN_SECRET || 'admin-secret-key';

// 管理员认证中间件
export function isAdminAuthenticated(request: NextRequest): boolean {
  // 检查Authorization header
  const authHeader = request.headers.get('authorization');
  if (!authHeader) {
    return false;
  }

  // 支持Bearer token格式
  const token = authHeader.startsWith('Bearer ') 
    ? authHeader.slice(7) 
    : authHeader;

  return token === ADMIN_SECRET;
}

// 管理员认证装饰器函数
export function requireAdmin(handler: (request: NextRequest) => Promise<Response>) {
  return async (request: NextRequest): Promise<Response> => {
    if (!isAdminAuthenticated(request)) {
      return new Response(
        JSON.stringify({
          error: 'Unauthorized',
          message: '需要管理员权限',
        }),
        {
          status: 401,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    return handler(request);
  };
}

// 获取当前管理员身份（用于日志记录）
export function getAdminIdentity(request: NextRequest): string {
  // 在实际应用中，这里可以从JWT token中解析管理员信息
  // 目前简化为使用固定的管理员身份
  const authHeader = request.headers.get('authorization');
  if (authHeader && isAdminAuthenticated(request)) {
    return 'admin'; // 可以扩展为从token中解析具体的管理员ID
  }
  return 'unknown';
}

// 验证管理员权限的工具函数
export function validateAdminAccess(request: NextRequest): {
  isValid: boolean;
  adminId: string;
  error?: string;
} {
  if (!isAdminAuthenticated(request)) {
    return {
      isValid: false,
      adminId: '',
      error: '未授权的访问',
    };
  }

  const adminId = getAdminIdentity(request);
  return {
    isValid: true,
    adminId,
  };
}