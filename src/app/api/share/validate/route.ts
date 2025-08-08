import { NextRequest, NextResponse } from 'next/server';
import { validateShareLink, extractGameIdFromShareLink } from '@/lib/share';
import { GameDAL } from '@/lib/dal';

/**
 * 验证分享链接的有效性
 * POST /api/share/validate
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { shareLink } = body;

    if (!shareLink || typeof shareLink !== 'string') {
      return NextResponse.json(
        { error: '分享链接不能为空' },
        { status: 400 }
      );
    }

    // 验证链接格式
    const validation = validateShareLink(shareLink);
    if (!validation.isValid) {
      return NextResponse.json(
        { 
          valid: false, 
          error: validation.error || '无效的分享链接格式' 
        },
        { status: 200 }
      );
    }

    // 提取游戏ID
    const gameId = extractGameIdFromShareLink(shareLink);
    if (!gameId) {
      return NextResponse.json(
        { 
          valid: false, 
          error: '无法从分享链接中提取游戏ID' 
        },
        { status: 200 }
      );
    }

    // 检查游戏是否存在且已发布
    try {
      const game = await GameDAL.getByIdWithMetadata(gameId);
      
      if (!game) {
        return NextResponse.json(
          { 
            valid: false, 
            error: '游戏不存在' 
          },
          { status: 200 }
        );
      }

      if (game.status !== 'approved') {
        return NextResponse.json(
          { 
            valid: false, 
            error: '游戏未发布或已下架' 
          },
          { status: 200 }
        );
      }

      // 分享链接有效
      return NextResponse.json({
        valid: true,
        gameId: game.id,
        gameTitle: game.title,
        gameDescription: game.description,
        authorName: game.authorName,
      });

    } catch (dbError) {
      console.error('Database error during share link validation:', dbError);
      return NextResponse.json(
        { 
          valid: false, 
          error: '验证游戏状态时发生错误' 
        },
        { status: 200 }
      );
    }

  } catch (error) {
    console.error('Error validating share link:', error);
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    );
  }
}

/**
 * 获取分享链接的元数据（用于预览）
 * GET /api/share/validate?url=<shareLink>
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const shareLink = searchParams.get('url');

    if (!shareLink) {
      return NextResponse.json(
        { error: '缺少分享链接参数' },
        { status: 400 }
      );
    }

    // 验证链接格式
    const validation = validateShareLink(shareLink);
    if (!validation.isValid) {
      return NextResponse.json(
        { 
          valid: false, 
          error: validation.error || '无效的分享链接格式' 
        },
        { status: 200 }
      );
    }

    // 提取游戏ID
    const gameId = extractGameIdFromShareLink(shareLink);
    if (!gameId) {
      return NextResponse.json(
        { 
          valid: false, 
          error: '无法从分享链接中提取游戏ID' 
        },
        { status: 200 }
      );
    }

    // 获取游戏信息用于预览
    try {
      const game = await GameDAL.getByIdWithMetadata(gameId);
      
      if (!game || game.status !== 'approved') {
        return NextResponse.json(
          { 
            valid: false, 
            error: '游戏不存在或未发布' 
          },
          { status: 200 }
        );
      }

      // 返回游戏预览信息
      return NextResponse.json({
        valid: true,
        preview: {
          title: game.title,
          description: game.description || `体验 ${game.title} 这个有趣的HTML小游戏`,
          authorName: game.authorName,
          createdAt: game.createdAt,
          approvedAt: game.approvedAt,
          url: shareLink,
        }
      });

    } catch (dbError) {
      console.error('Database error during share link preview:', dbError);
      return NextResponse.json(
        { 
          valid: false, 
          error: '获取游戏预览信息时发生错误' 
        },
        { status: 200 }
      );
    }

  } catch (error) {
    console.error('Error getting share link preview:', error);
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    );
  }
}