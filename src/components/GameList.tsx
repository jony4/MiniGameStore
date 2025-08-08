'use client';

import { useState, useEffect } from 'react';
import { GameCard } from './GameCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { GameListItem } from '@/lib/schema';
import { ChevronLeft, ChevronRight, Search, Loader2 } from 'lucide-react';

interface GameListResponse {
  games: GameListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface GameListProps {
  initialGames?: GameListItem[];
  showStatusFilter?: boolean;
  defaultStatus?: 'pending' | 'approved' | 'rejected';
}

export function GameList({ 
  initialGames = [], 
  showStatusFilter = true,
  defaultStatus = 'approved'
}: GameListProps) {
  const [games, setGames] = useState<GameListItem[]>(initialGames);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState<string>(defaultStatus);
  const [limit] = useState(12); // Fixed page size

  const fetchGames = async (page: number, statusFilter?: string, search?: string) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      if (statusFilter && statusFilter !== 'all') {
        params.append('status', statusFilter);
      }

      if (search && search.trim()) {
        params.append('search', search.trim());
      }

      const response = await fetch(`/api/games?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('获取游戏列表失败');
      }

      const data: GameListResponse = await response.json();
      
      setGames(data.games);
      setCurrentPage(data.pagination.page);
      setTotalPages(data.pagination.totalPages);
      setTotal(data.pagination.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取游戏列表失败');
      setGames([]);
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    if (initialGames.length === 0) {
      fetchGames(1, status);
    }
  }, []);

  // Handle status filter change
  const handleStatusChange = (newStatus: string) => {
    setStatus(newStatus);
    setCurrentPage(1);
    fetchGames(1, newStatus, searchTerm);
  };

  // Handle search
  const handleSearch = () => {
    setCurrentPage(1);
    fetchGames(1, status, searchTerm);
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      fetchGames(page, status, searchTerm);
    }
  };

  // Handle search input key press
  const handleSearchKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'approved':
        return '已发布';
      case 'pending':
        return '待审核';
      case 'rejected':
        return '已拒绝';
      case 'all':
        return '全部';
      default:
        return '未知';
    }
  };

  return (
    <div className="space-y-6">
      {/* 搜索和筛选 */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Label htmlFor="search" className="sr-only">
            搜索游戏
          </Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              id="search"
              type="text"
              placeholder="搜索游戏标题或作者..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={handleSearchKeyPress}
              className="pl-10"
            />
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button onClick={handleSearch} disabled={loading}>
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
            搜索
          </Button>
          
          {showStatusFilter && (
            <Select value={status} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部</SelectItem>
                <SelectItem value="approved">已发布</SelectItem>
                <SelectItem value="pending">待审核</SelectItem>
                <SelectItem value="rejected">已拒绝</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {/* 游戏统计 */}
      {!loading && (
        <div className="text-sm text-muted-foreground">
          共找到 {total} 个游戏
          {status !== 'all' && ` (${getStatusLabel(status)})`}
        </div>
      )}

      {/* 错误提示 */}
      {error && (
        <div className="text-center py-8">
          <p className="text-destructive">{error}</p>
          <Button 
            variant="outline" 
            onClick={() => fetchGames(currentPage, status, searchTerm)}
            className="mt-2"
          >
            重试
          </Button>
        </div>
      )}

      {/* 加载状态 */}
      {loading && (
        <div className="text-center py-8">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="mt-2 text-muted-foreground">加载中...</p>
        </div>
      )}

      {/* 游戏列表 */}
      {!loading && !error && (
        <>
          {games.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">暂无游戏</p>
              {searchTerm && (
                <p className="text-sm text-muted-foreground mt-1">
                  尝试调整搜索条件或筛选器
                </p>
              )}
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {games.map((game) => (
                <GameCard key={game.id} game={game} />
              ))}
            </div>
          )}

          {/* 分页 */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage <= 1 || loading}
              >
                <ChevronLeft className="h-4 w-4" />
                上一页
              </Button>
              
              <div className="flex items-center space-x-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => handlePageChange(pageNum)}
                      disabled={loading}
                      className="w-10"
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= totalPages || loading}
              >
                下一页
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}