'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { GameListItem } from '@/lib/schema';

interface AdminReviewPanelProps {
  game: GameListItem;
  onReviewComplete: (gameId: string, action: 'approve' | 'reject') => void;
}

export function AdminReviewPanel({ game, onReviewComplete }: AdminReviewPanelProps) {
  const [isReviewing, setIsReviewing] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);
  const { toast } = useToast();

  const handleApprove = async () => {
    setIsReviewing(true);
    try {
      const response = await fetch('/api/admin/review', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_ADMIN_SECRET || 'admin-secret-key'}`,
        },
        body: JSON.stringify({
          gameId: game.id,
          action: 'approve',
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: '审核成功',
          description: '游戏已批准发布',
        });
        onReviewComplete(game.id, 'approve');
      } else {
        throw new Error(result.message || '审核失败');
      }
    } catch (error) {
      toast({
        title: '审核失败',
        description: error instanceof Error ? error.message : '未知错误',
        variant: 'destructive',
      });
    } finally {
      setIsReviewing(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast({
        title: '请填写拒绝原因',
        description: '拒绝游戏时必须提供拒绝原因',
        variant: 'destructive',
      });
      return;
    }

    setIsReviewing(true);
    try {
      const response = await fetch('/api/admin/review', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_ADMIN_SECRET || 'admin-secret-key'}`,
        },
        body: JSON.stringify({
          gameId: game.id,
          action: 'reject',
          reason: rejectionReason,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: '审核成功',
          description: '游戏已拒绝',
        });
        onReviewComplete(game.id, 'reject');
        setShowRejectForm(false);
        setRejectionReason('');
      } else {
        throw new Error(result.message || '审核失败');
      }
    } catch (error) {
      toast({
        title: '审核失败',
        description: error instanceof Error ? error.message : '未知错误',
        variant: 'destructive',
      });
    } finally {
      setIsReviewing(false);
    }
  };

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
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{game.title}</CardTitle>
          {getStatusBadge(game.status)}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <Label className="text-muted-foreground">作者</Label>
            <p>{game.authorName || '匿名'}</p>
          </div>
          <div>
            <Label className="text-muted-foreground">提交时间</Label>
            <p>{new Date(game.createdAt).toLocaleString('zh-CN')}</p>
          </div>
        </div>

        {game.description && (
          <div>
            <Label className="text-muted-foreground">游戏描述</Label>
            <p className="mt-1 text-sm">{game.description}</p>
          </div>
        )}

        {game.status === 'pending' && (
          <div className="flex gap-2 pt-4">
            <Button
              onClick={handleApprove}
              disabled={isReviewing}
              className="flex-1"
            >
              {isReviewing ? '处理中...' : '批准'}
            </Button>
            <Button
              variant="destructive"
              onClick={() => setShowRejectForm(!showRejectForm)}
              disabled={isReviewing}
              className="flex-1"
            >
              拒绝
            </Button>
          </div>
        )}

        {showRejectForm && (
          <div className="space-y-3 border-t pt-4">
            <Label htmlFor="rejection-reason">拒绝原因</Label>
            <Textarea
              id="rejection-reason"
              placeholder="请输入拒绝原因..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={3}
            />
            <div className="flex gap-2">
              <Button
                onClick={handleReject}
                disabled={isReviewing || !rejectionReason.trim()}
                variant="destructive"
                size="sm"
              >
                确认拒绝
              </Button>
              <Button
                onClick={() => {
                  setShowRejectForm(false);
                  setRejectionReason('');
                }}
                variant="outline"
                size="sm"
              >
                取消
              </Button>
            </div>
          </div>
        )}

        {game.status === 'approved' && game.approvedAt && (
          <div className="text-sm text-muted-foreground border-t pt-4">
            批准时间: {new Date(game.approvedAt).toLocaleString('zh-CN')}
          </div>
        )}
      </CardContent>
    </Card>
  );
}