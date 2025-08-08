import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { GameRenderer } from '@/components/GameRenderer';
import { GameMetadata } from '@/components/GameMetadata';
import { ShareButton } from '@/components/ShareButton';
import { GameDAL } from '@/lib/dal';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface GamePageProps {
  params: {
    id: string;
  };
}

// 生成页面元数据
export async function generateMetadata({ params }: GamePageProps): Promise<Metadata> {
  try {
    const game = await GameDAL.getByIdWithMetadata(params.id);
    
    if (!game || game.status !== 'approved') {
      return {
        title: '游戏不存在 - HTML小游戏平台',
        description: '您访问的游戏不存在或未发布',
      };
    }

    return {
      title: `${game.title} - HTML小游戏平台`,
      description: game.description || `体验 ${game.title} 这个有趣的HTML小游戏`,
      openGraph: {
        title: game.title,
        description: game.description || `体验 ${game.title} 这个有趣的HTML小游戏`,
        type: 'website',
        url: `/game/${game.id}`,
      },
      twitter: {
        card: 'summary',
        title: game.title,
        description: game.description || `体验 ${game.title} 这个有趣的HTML小游戏`,
      },
    };
  } catch (error) {
    console.error('Error generating metadata:', error);
    return {
      title: '游戏加载失败 - HTML小游戏平台',
      description: '游戏信息加载失败',
    };
  }
}

export default async function GamePage({ params }: GamePageProps) {
  let game;
  
  try {
    game = await GameDAL.getByIdWithMetadata(params.id);
  } catch (error) {
    console.error('Error fetching game:', error);
    notFound();
  }

  // 如果游戏不存在或未发布，返回404
  if (!game || game.status !== 'approved') {
    notFound();
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* 导航栏 */}
      <div className="flex items-center justify-between">
        <Link href="/games">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回游戏列表
          </Button>
        </Link>
        <ShareButton 
          gameId={game.id} 
          gameTitle={game.title}
        />
      </div>

      {/* 游戏内容区域 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 游戏渲染器 - 占据主要空间 */}
        <div className="lg:col-span-2">
          <GameRenderer 
            htmlContent={game.htmlContent}
            title={game.title}
            className="w-full"
          />
        </div>

        {/* 游戏元数据 - 侧边栏 */}
        <div className="lg:col-span-1">
          <GameMetadata 
            game={game}
            className="sticky top-6"
          />
        </div>
      </div>
    </div>
  );
}
