import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, User, Clock } from 'lucide-react';
import { GameWithMetadata } from '@/lib/schema';

interface GameMetadataProps {
  game: GameWithMetadata;
  className?: string;
}

export function GameMetadata({ game, className }: GameMetadataProps) {
  const formatDate = (date: Date | null) => {
    if (!date) return '未知';
    return new Intl.DateTimeFormat('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge variant="default" className="bg-green-100 text-green-800">已发布</Badge>;
      case 'pending':
        return <Badge variant="secondary">待审核</Badge>;
      case 'rejected':
        return <Badge variant="destructive">已拒绝</Badge>;
      default:
        return <Badge variant="outline">未知状态</Badge>;
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{game.title}</span>
          {getStatusBadge(game.status || 'pending')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {game.description && (
          <div>
            <h4 className="text-sm font-medium mb-2">游戏描述</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {game.description}
            </p>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">作者:</span>
            <span>{game.authorName || '匿名用户'}</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">提交时间:</span>
            <span>{formatDate(game.createdAt)}</span>
          </div>
          
          {game.approvedAt && (
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">发布时间:</span>
              <span>{formatDate(game.approvedAt)}</span>
            </div>
          )}
          
          {game.approvedBy && (
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">审核员:</span>
              <span>{game.approvedBy}</span>
            </div>
          )}
        </div>

        {game.rejectionReason && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
            <h4 className="text-sm font-medium text-destructive mb-1">拒绝原因</h4>
            <p className="text-sm text-destructive/80">{game.rejectionReason}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}