import { NextRequest, NextResponse } from 'next/server';
import { GameDAL } from '@/lib/dal';
import { gameIdSchema } from '@/lib/validation';
import { ApiResponse } from '@/types/database';
import { isAdminAuthenticated } from '@/lib/auth';

interface RouteParams {
  params: {
    id: string;
  };
}

// GET /api/games/[id] - 获取单个游戏
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // 验证游戏ID格式
    const validationResult = gameIdSchema.safeParse({ id: params.id });
    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'VALIDATION_ERROR',
          message: '游戏ID格式不正确',
        } as ApiResponse,
        { status: 400 }
      );
    }

    // 检查是否是管理员请求
    const isAdmin = isAdminAuthenticated(request);

    // 获取游戏数据
    const game = await GameDAL.getByIdWithMetadata(params.id);
    
    if (!game) {
      return NextResponse.json(
        {
          success: false,
          error: 'GAME_NOT_FOUND',
          message: '游戏不存在',
        } as ApiResponse,
        { status: 404 }
      );
    }

    // 管理员可以查看任何状态的游戏，普通用户只能查看已发布的游戏
    if (!isAdmin && game.status !== 'approved') {
      return NextResponse.json(
        {
          success: false,
          error: 'GAME_NOT_FOUND',
          message: '游戏不存在或未发布',
        } as ApiResponse,
        { status: 404 }
      );
    }

    // 为管理员返回完整的游戏数据，为普通用户返回基本数据
    const responseData = isAdmin ? {
      game: game,
      adminView: true,
    } : {
      game: game,
      adminView: false,
    };

    return NextResponse.json(
      {
        success: true,
        data: responseData,
      } as ApiResponse,
      { 
        status: 200,
        headers: isAdmin ? {} : {
          'Cache-Control': 'public, max-age=300, s-maxage=600', // 只为普通用户设置缓存
        }
      }
    );
  } catch (error) {
    console.error('Error fetching game:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'DATABASE_ERROR',
        message: '获取游戏数据失败',
      } as ApiResponse,
      { status: 500 }
    );
  }
}
