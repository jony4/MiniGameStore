'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Game } from '@/lib/schema';

interface GamePreviewProps {
  game: Game;
  showHtmlContent?: boolean;
}

export function GamePreview({ game, showHtmlContent = false }: GamePreviewProps) {
  const [showPreview, setShowPreview] = useState(false);
  const [showCode, setShowCode] = useState(false);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">待审核</Badge>;
      case 'approved':
        return <Badge variant="default">已批准</Badge>;
      case 'rejected':
        return <Badge variant="destructive">已拒绝</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{game.title}</CardTitle>
            {getStatusBadge(game.status)}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">作者:</span> {game.authorName || '匿名'}
            </div>
            <div>
              <span className="font-medium">提交时间:</span>{' '}
              {new Date(game.createdAt).toLocaleString('zh-CN')}
            </div>
          </div>

          {game.description && (
            <div>
              <span className="font-medium">描述:</span>
              <p className="mt-1 text-sm text-muted-foreground">{game.description}</p>
            </div>
          )}

          {game.status === 'rejected' && game.rejectionReason && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
              <span className="font-medium text-destructive">拒绝原因:</span>
              <p className="mt-1 text-sm text-destructive">{game.rejectionReason}</p>
            </div>
          )}

          {game.status === 'approved' && game.approvedAt && game.approvedBy && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-md">
              <span className="font-medium text-green-800">审核信息:</span>
              <p className="mt-1 text-sm text-green-700">
                由 {game.approvedBy} 于 {new Date(game.approvedAt).toLocaleString('zh-CN')} 批准
              </p>
            </div>
          )}

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPreview(!showPreview)}
            >
              {showPreview ? '隐藏预览' : '预览游戏'}
            </Button>
            {showHtmlContent && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCode(!showCode)}
              >
                {showCode ? '隐藏代码' : '查看代码'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {showPreview && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">游戏预览</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border rounded-md overflow-hidden">
              <iframe
                srcDoc={game.htmlContent}
                className="w-full h-96 border-0"
                sandbox="allow-scripts allow-same-origin"
                title={`预览: ${game.title}`}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {showCode && showHtmlContent && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">HTML 代码</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-4 rounded-md overflow-auto text-sm max-h-96">
              <code>{game.htmlContent}</code>
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}