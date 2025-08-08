import { NextRequest, NextResponse } from 'next/server';
import { isValidGameId } from '@/lib/share';
import { GameDAL } from '@/lib/dal';

/**
 * 跟踪分享事件
 * POST /api/share/track
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { gameId, shareType } = body;

    // 验证参数
    if (!gameId || !isValidGameId(gameId)) {
      return NextResponse.json(
        { error: '无效的游戏ID' },
        { status: 400 }
      );
    }

    if (!shareType || !['link', 'qrcode', 'text'].includes(shareType)) {
      return NextResponse.json(
        { error: '无效的分享类型' },
        { status: 400 }
      );
    }

    // 检查游戏是否存在且已发布
    try {
      const game = await GameDAL.getByIdWithMetadata(gameId);
      
      if (!game) {
        return NextResponse.json(
          { error: '游戏不存在' },
          { status: 404 }
        );
      }

      if (game.status !== 'approved') {
        return NextResponse.json(
          { error: '游戏未发布' },
          { status: 403 }
        );
      }

      // 这里可以添加分享统计的逻辑
      // 例如：记录到数据库、发送到分析服务等
      // 目前只是简单记录日志
      console.log(`Share tracked: gameId=${gameId}, type=${shareType}, timestamp=${new Date().toISOString()}`);

      return NextResponse.json({
        success: true,
        message: '分享事件已记录',
      });

    } catch (dbError) {
      console.error('Database error during share tracking:', dbError);
      return NextResponse.json(
        { error: '记录分享事件时发生错误' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error tracking share event:', error);
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    );
  }
}

/**
 * 获取游戏的分享统计
 * GET /api/share/track?gameId=<gameId>
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const gameId = searchParams.get('gameId');

    if (!gameId || !isValidGameId(gameId)) {
      return NextResponse.json(
        { error: '无效的游戏ID' },
        { status: 400 }
      );
    }

    // 检查游戏是否存在
    try {
      const game = await GameDAL.getByIdWithMetadata(gameId);
      
      if (!game) {
        return NextResponse.json(
          { error: '游戏不存在' },
          { status: 404 }
        );
      }

      // 这里应该从数据库或分析服务获取实际的分享统计
      // 目前返回模拟数据
      const mockStats = {
        gameId,
        totalShares: 0,
        sharesByType: {
          link: 0,
          qrcode: 0,
          text: 0,
        },
        recentShares: [],
      };

      return NextResponse.json({
        success: true,
        stats: mockStats,
      });

    } catch (dbError) {
      console.error('Database error during share stats retrieval:', dbError);
      return NextResponse.json(
        { error: '获取分享统计时发生错误' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error getting share stats:', error);
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    );
  }
}