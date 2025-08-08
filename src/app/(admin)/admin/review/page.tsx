'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { AdminReviewPanel } from '@/components/AdminReviewPanel';
import { GamePreview } from '@/components/GamePreview';
import { useToast } from '@/hooks/use-toast';
import { GameListItem, Game } from '@/lib/schema';

interface ReviewStats {
  totalReviews: number;
  approvals: number;
  rejections: number;
}

interface ReviewPageData {
  games: GameListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  stats: ReviewStats;
}

export default function ReviewPage() {
  const [data, setData] = useState<ReviewPageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const { toast } = useToast();

  const fetchReviewData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
      });

      if (statusFilter && statusFilter !== 'all') {
        params.append('status', statusFilter);
      }

      if (searchQuery.trim()) {
        params.append('search', searchQuery.trim());
      }

      const response = await fetch(`/api/admin/review?${params}`, {
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_ADMIN_SECRET || 'admin-secret-key'}`,
        },
      });

      if (!response.ok) {
        throw new Error('获取审核数据失败');
      }

      const result = await response.json();
      if (result.success) {
        setData(result.data);
      } else {
        throw new Error(result.message || '获取数据失败');
      }
    } catch (error) {
      toast({
        title: '加载失败',
        description: error instanceof Error ? error.message : '未知错误',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchGameDetails = async (gameId: string) => {
    try {
      const response = await fetch(`/api/games/${gameId}`, {
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_ADMIN_SECRET || 'admin-secret-key'}`,
        },
      });

      if (!response.ok) {
        throw new Error('获取游戏详情失败');
      }

      const result = await response.json();
      if (result.success) {
        setSelectedGame(result.data.game);
      } else {
        throw new Error(result.message || '获取游戏详情失败');
      }
    } catch (error) {
      toast({
        title: '加载游戏详情失败',
        description: error instanceof Error ? error.message : '未知错误',
        variant: 'destructive',
      });
    }
  };

  const handleReviewComplete = (gameId: string, action: 'approve' | 'reject') => {
    // 刷新数据
    fetchReviewData();
    // 如果当前选中的游戏被审核了，重新加载详情
    if (selectedGame && selectedGame.id === gameId) {
      fetchGameDetails(gameId);
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    fetchReviewData();
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  useEffect(() => {
    fetchReviewData();
  }, [currentPage, statusFilter]);

  if (loading && !data) {
    return (
      <div className="mx-auto max-w-6xl">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">加载中...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>游戏审核</CardTitle>
          <CardDescription>审核待发布的游戏内容</CardDescription>
        </CardHeader>
        <CardContent>
          {data?.stats && (
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center">
                <div className="text-2xl font-bold">{data.stats.totalReviews}</div>
                <div className="text-sm text-muted-foreground">总审核数</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{data.stats.approvals}</div>
                <div className="text-sm text-muted-foreground">已批准</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{data.stats.rejections}</div>
                <div className="text-sm text-muted-foreground">已拒绝</div>
              </div>
            </div>
          )}

          <div className="flex gap-4 mb-6">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="筛选状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部</SelectItem>
                <SelectItem value="pending">待审核</SelectItem>
                <SelectItem value="approved">已批准</SelectItem>
                <SelectItem value="rejected">已拒绝</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex gap-2 flex-1">
              <Input
                placeholder="搜索游戏标题或作者..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Button onClick={handleSearch}>搜索</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">
            游戏列表 {data?.pagination && `(${data.pagination.total} 个)`}
          </h3>
          
          {loading ? (
            <div className="text-center py-8">加载中...</div>
          ) : data?.games.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              没有找到符合条件的游戏
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {data?.games.map((game) => (
                  <Card
                    key={game.id}
                    className={`cursor-pointer transition-colors ${
                      selectedGame?.id === game.id ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => fetchGameDetails(game.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{game.title}</h4>
                          <p className="text-sm text-muted-foreground">
                            {game.authorName || '匿名'} • {new Date(game.createdAt).toLocaleDateString('zh-CN')}
                          </p>
                        </div>
                        <Badge
                          variant={
                            game.status === 'pending'
                              ? 'secondary'
                              : game.status === 'approved'
                              ? 'default'
                              : 'destructive'
                          }
                        >
                          {game.status === 'pending' ? '待审核' : game.status === 'approved' ? '已批准' : '已拒绝'}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {data?.pagination && data.pagination.totalPages > 1 && (
                <div className="flex justify-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    上一页
                  </Button>
                  <span className="flex items-center px-3 text-sm">
                    {currentPage} / {data.pagination.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === data.pagination.totalPages}
                  >
                    下一页
                  </Button>
                </div>
              )}
            </>
          )}
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">游戏详情</h3>
          
          {selectedGame ? (
            <div className="space-y-4">
              <GamePreview game={selectedGame} showHtmlContent={true} />
              
              {selectedGame.status === 'pending' && (
                <AdminReviewPanel
                  game={{
                    id: selectedGame.id,
                    title: selectedGame.title,
                    description: selectedGame.description,
                    authorName: selectedGame.authorName,
                    status: selectedGame.status,
                    createdAt: selectedGame.createdAt,
                    approvedAt: selectedGame.approvedAt,
                  }}
                  onReviewComplete={handleReviewComplete}
                />
              )}
            </div>
          ) : (
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground">
                点击左侧游戏查看详情
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
