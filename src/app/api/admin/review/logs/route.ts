import { NextRequest, NextResponse } from 'next/server';
import { ReviewLogDAL } from '@/lib/dal';
import { requireAdmin } from '@/lib/auth';

// GET /api/admin/review/logs - 获取审核日志
export const GET = requireAdmin(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const gameId = searchParams.get('gameId');
    const reviewer = searchParams.get('reviewer');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    let logs;
    
    if (gameId) {
      // 获取特定游戏的审核日志
      logs = await ReviewLogDAL.getByGameIdWithGame(gameId);
    } else if (reviewer) {
      // 获取特定审核员的日志
      logs = await ReviewLogDAL.getByReviewer(reviewer);
    } else {
      // 获取所有审核日志
      logs = await ReviewLogDAL.getAllWithGame(limit, offset);
    }

    // 获取统计信息
    const stats = await ReviewLogDAL.getReviewStats(reviewer || undefined);

    return NextResponse.json({
      success: true,
      data: {
        logs,
        stats,
        pagination: {
          limit,
          offset,
          hasMore: logs.length === limit,
        },
      },
    });
  } catch (error) {
    console.error('获取审核日志失败:', error);
    return NextResponse.json(
      {
        success: false,
        error: '获取审核日志失败',
        message: error instanceof Error ? error.message : '未知错误',
      },
      { status: 500 }
    );
  }
});