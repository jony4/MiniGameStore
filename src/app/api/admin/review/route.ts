import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { GameDAL, ReviewLogDAL } from '@/lib/dal';
import { requireAdmin, validateAdminAccess } from '@/lib/auth';

// 审核请求的验证schema
const reviewRequestSchema = z.object({
  gameId: z.string().min(1, '游戏ID不能为空'),
  action: z.enum(['approve', 'reject'], {
    errorMap: () => ({ message: '操作必须是approve或reject' }),
  }),
  reason: z.string().optional(),
});

// GET /api/admin/review - 获取待审核游戏列表
export const GET = requireAdmin(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as 'pending' | 'approved' | 'rejected' | null;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';

    // 获取游戏列表
    const { games, total } = await GameDAL.getListItems(
      { page, limit },
      { status: status || undefined, search }
    );

    // 获取审核统计信息
    const stats = await ReviewLogDAL.getReviewStats();

    return NextResponse.json({
      success: true,
      data: {
        games,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
        stats,
      },
    });
  } catch (error) {
    console.error('获取审核列表失败:', error);
    return NextResponse.json(
      {
        success: false,
        error: '获取审核列表失败',
        message: error instanceof Error ? error.message : '未知错误',
      },
      { status: 500 }
    );
  }
});

// POST /api/admin/review - 审核游戏
export const POST = requireAdmin(async (request: NextRequest) => {
  try {
    const body = await request.json();
    
    // 验证请求数据
    const validationResult = reviewRequestSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: '请求数据无效',
          details: validationResult.error.errors,
        },
        { status: 400 }
      );
    }

    const { gameId, action, reason } = validationResult.data;

    // 验证管理员权限并获取管理员身份
    const adminValidation = validateAdminAccess(request);
    if (!adminValidation.isValid) {
      return NextResponse.json(
        {
          success: false,
          error: adminValidation.error,
        },
        { status: 401 }
      );
    }

    // 检查游戏是否存在
    const existingGame = await GameDAL.getById(gameId);
    if (!existingGame) {
      return NextResponse.json(
        {
          success: false,
          error: '游戏不存在',
        },
        { status: 404 }
      );
    }

    // 检查游戏是否已经被审核过
    if (existingGame.status !== 'pending') {
      return NextResponse.json(
        {
          success: false,
          error: `游戏已经被${existingGame.status === 'approved' ? '批准' : '拒绝'}，无法重复审核`,
        },
        { status: 400 }
      );
    }

    // 验证拒绝操作必须提供原因
    if (action === 'reject' && (!reason || reason.trim().length === 0)) {
      return NextResponse.json(
        {
          success: false,
          error: '拒绝游戏时必须提供拒绝原因',
        },
        { status: 400 }
      );
    }

    // 更新游戏状态
    const updatedGame = await GameDAL.updateStatus(
      gameId,
      action,
      adminValidation.adminId,
      reason
    );

    if (!updatedGame) {
      return NextResponse.json(
        {
          success: false,
          error: '更新游戏状态失败',
        },
        { status: 500 }
      );
    }

    // 记录审核日志
    await ReviewLogDAL.create({
      gameId,
      action,
      reason: reason || null,
      reviewer: adminValidation.adminId,
    });

    return NextResponse.json({
      success: true,
      message: `游戏已${action === 'approve' ? '批准' : '拒绝'}`,
      data: {
        game: updatedGame,
        action,
        reviewer: adminValidation.adminId,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('审核游戏失败:', error);
    return NextResponse.json(
      {
        success: false,
        error: '审核游戏失败',
        message: error instanceof Error ? error.message : '未知错误',
      },
      { status: 500 }
    );
  }
});
