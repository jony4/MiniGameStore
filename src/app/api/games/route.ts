import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { GameDAL } from '@/lib/dal';
import { gameSubmissionSchema, gameListQuerySchema } from '@/lib/validation';
import { validateHtmlContent, validateStringContent } from '@/lib/security';

// GET /api/games - 获取游戏列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status') as 'pending' | 'approved' | 'rejected' | null;
    const search = searchParams.get('search');

    // 验证查询参数
    const queryValidation = gameListQuerySchema.safeParse({
      page,
      limit,
      status: status || undefined,
      search: search || undefined,
    });

    if (!queryValidation.success) {
      return NextResponse.json(
        {
          error: 'VALIDATION_ERROR',
          message: '查询参数验证失败',
          details: queryValidation.error.errors,
        },
        { status: 400 }
      );
    }

    const { page: validPage, limit: validLimit, status: validStatus, search: validSearch } = queryValidation.data;

    // 获取游戏列表
    const { games, total } = await GameDAL.getListItems(
      { page: validPage, limit: validLimit },
      { 
        ...(validStatus && { status: validStatus }),
        ...(validSearch && { search: validSearch })
      }
    );

    return NextResponse.json({
      games,
      pagination: {
        page: validPage,
        limit: validLimit,
        total,
        totalPages: Math.ceil(total / validLimit),
      },
    });
  } catch (error) {
    console.error('获取游戏列表失败:', error);
    return NextResponse.json(
      {
        error: 'DATABASE_ERROR',
        message: '获取游戏列表失败',
      },
      { status: 500 }
    );
  }
}

// POST /api/games - 提交新游戏
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 验证请求数据
    const validation = gameSubmissionSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'VALIDATION_ERROR',
          message: '游戏数据验证失败',
          details: validation.error.errors,
        },
        { status: 400 }
      );
    }

    const { title, description, htmlContent, authorName } = validation.data;

    // 验证HTML内容大小
    const contentValidation = validateStringContent(htmlContent);
    if (!contentValidation.isValid) {
      return NextResponse.json(
        {
          error: 'FILE_TOO_LARGE',
          message: '内容验证失败',
          details: contentValidation.errors,
        },
        { status: 400 }
      );
    }

    // 验证HTML内容安全性
    const securityValidation = validateHtmlContent(htmlContent);
    if (!securityValidation.isValid) {
      return NextResponse.json(
        {
          error: 'MALICIOUS_CONTENT',
          message: 'HTML内容包含不安全的元素',
          details: {
            violations: securityValidation.violations,
            warnings: securityValidation.warnings,
          },
        },
        { status: 400 }
      );
    }

    // 创建游戏记录
    const gameId = uuidv4();
    const newGame = {
      id: gameId,
      title: title.trim(),
      description: description?.trim() || null,
      htmlContent,
      authorName: authorName?.trim() || null,
      status: 'pending' as const,
    };

    const createdGame = await GameDAL.create(newGame);

    return NextResponse.json(
      {
        message: '游戏提交成功，等待审核',
        game: {
          id: createdGame.id,
          title: createdGame.title,
          description: createdGame.description,
          authorName: createdGame.authorName,
          status: createdGame.status,
          createdAt: createdGame.createdAt,
        },
        warnings: securityValidation.warnings.length > 0 ? securityValidation.warnings : undefined,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('游戏提交失败:', error);
    
    // 检查是否是数据库相关错误
    if (error instanceof Error && error.message.includes('Failed to create game')) {
      return NextResponse.json(
        {
          error: 'DATABASE_ERROR',
          message: '游戏保存失败，请稍后重试',
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        error: 'INTERNAL_ERROR',
        message: '服务器内部错误',
      },
      { status: 500 }
    );
  }
}
