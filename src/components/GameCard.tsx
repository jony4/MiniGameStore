import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ShareButton } from '@/components/ShareButton';
import { GameListItem } from '@/lib/schema';

interface GameCardProps {
  game: GameListItem;
}

export function GameCard({ game }: GameCardProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge variant="default" className="bg-green-500">已发布</Badge>;
      case 'pending':
        return <Badge variant="secondary">待审核</Badge>;
      case 'rejected':
        return <Badge variant="destructive">已拒绝</Badge>;
      default:
        return <Badge variant="outline">未知</Badge>;
    }
  };

  const formatDate = (date: Date) => {
    return formatDistanceToNow(new Date(date), {
      addSuffix: true,
      locale: zhCN,
    });
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg line-clamp-2">{game.title}</CardTitle>
            <CardDescription className="mt-1">
              {game.authorName ? `作者: ${game.authorName}` : '匿名作者'}
            </CardDescription>
          </div>
          <div className="ml-2 flex-shrink-0">
            {getStatusBadge(game.status)}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col">
        <div className="flex-1">
          {game.description && (
            <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
              {game.description}
            </p>
          )}
        </div>
        
        <div className="space-y-3">
          <div className="text-xs text-muted-foreground">
            <div>提交时间: {formatDate(game.createdAt)}</div>
            {game.approvedAt && (
              <div>发布时间: {formatDate(game.approvedAt)}</div>
            )}
          </div>
          
          <div className="flex gap-2">
            {game.status === 'approved' && (
              <Button asChild size="sm" className="flex-1">
                <Link href={`/game/${game.id}`}>
                  开始游戏
                </Link>
              </Button>
            )}
            
            <Button asChild variant="outline" size="sm" className="flex-1">
              <Link href={`/game/${game.id}/details`}>
                查看详情
              </Link>
            </Button>
          </div>
          
          {/* 分享按钮 - 只在已发布的游戏上显示 */}
          {game.status === 'approved' && (
            <div className="pt-2 border-t">
              <ShareButton 
                gameId={game.id} 
                gameTitle={game.title}
                className="w-full"
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}