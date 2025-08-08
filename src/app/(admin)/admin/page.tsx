'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface DashboardStats {
  totalGames: number;
  pendingGames: number;
  approvedGames: number;
  rejectedGames: number;
  totalReviews: number;
  approvals: number;
  rejections: number;
}

export default function AdminPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchDashboardStats = async () => {
    try {
      // 获取所有状态的游戏统计
      const [allGames, pendingGames, approvedGames, rejectedGames, reviewStats] = await Promise.all([
        fetch('/api/admin/review?status=all&limit=1', {
          headers: {
            'Authorization': `Bearer ${process.env.NEXT_PUBLIC_ADMIN_SECRET || 'admin-secret-key'}`,
          },
        }),
        fetch('/api/admin/review?status=pending&limit=1', {
          headers: {
            'Authorization': `Bearer ${process.env.NEXT_PUBLIC_ADMIN_SECRET || 'admin-secret-key'}`,
          },
        }),
        fetch('/api/admin/review?status=approved&limit=1', {
          headers: {
            'Authorization': `Bearer ${process.env.NEXT_PUBLIC_ADMIN_SECRET || 'admin-secret-key'}`,
          },
        }),
        fetch('/api/admin/review?status=rejected&limit=1', {
          headers: {
            'Authorization': `Bearer ${process.env.NEXT_PUBLIC_ADMIN_SECRET || 'admin-secret-key'}`,
          },
        }),
        fetch('/api/admin/review/logs?limit=1', {
          headers: {
            'Authorization': `Bearer ${process.env.NEXT_PUBLIC_ADMIN_SECRET || 'admin-secret-key'}`,
          },
        }),
      ]);

      const [allData, pendingData, approvedData, rejectedData, reviewData] = await Promise.all([
        allGames.json(),
        pendingGames.json(),
        approvedGames.json(),
        rejectedGames.json(),
        reviewStats.json(),
      ]);

      if (allData.success && pendingData.success && approvedData.success && rejectedData.success && reviewData.success) {
        setStats({
          totalGames: allData.data.pagination.total,
          pendingGames: pendingData.data.pagination.total,
          approvedGames: approvedData.data.pagination.total,
          rejectedGames: rejectedData.data.pagination.total,
          totalReviews: reviewData.data.stats.totalReviews,
          approvals: reviewData.data.stats.approvals,
          rejections: reviewData.data.stats.rejections,
        });
      } else {
        throw new Error('获取统计数据失败');
      }
    } catch (error) {
      toast({
        title: '加载统计数据失败',
        description: error instanceof Error ? error.message : '未知错误',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">加载中...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>管理员仪表板</CardTitle>
          <CardDescription>管理游戏提交和审核</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {stats?.totalGames || 0}
              </div>
              <div className="text-sm text-blue-700">总游戏数</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">
                {stats?.pendingGames || 0}
              </div>
              <div className="text-sm text-yellow-700">待审核</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {stats?.approvedGames || 0}
              </div>
              <div className="text-sm text-green-700">已批准</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">
                {stats?.rejectedGames || 0}
              </div>
              <div className="text-sm text-red-700">已拒绝</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">快速操作</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link href="/admin/review">
                  <Button className="w-full justify-start">
                    审核游戏
                    {stats && stats.pendingGames > 0 && (
                      <Badge variant="secondary" className="ml-auto">
                        {stats.pendingGames}
                      </Badge>
                    )}
                  </Button>
                </Link>
                <Link href="/games">
                  <Button variant="outline" className="w-full justify-start">
                    查看已发布游戏
                  </Button>
                </Link>
                <Link href="/submit">
                  <Button variant="outline" className="w-full justify-start">
                    提交新游戏
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">审核统计</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>总审核次数:</span>
                    <span className="font-medium">{stats?.totalReviews || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>批准次数:</span>
                    <span className="font-medium text-green-600">{stats?.approvals || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>拒绝次数:</span>
                    <span className="font-medium text-red-600">{stats?.rejections || 0}</span>
                  </div>
                  {stats && stats.totalReviews > 0 && (
                    <div className="flex justify-between pt-2 border-t">
                      <span>批准率:</span>
                      <span className="font-medium">
                        {Math.round((stats.approvals / stats.totalReviews) * 100)}%
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {stats && stats.pendingGames > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="text-lg text-yellow-800">待处理提醒</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-yellow-700 mb-4">
              当前有 <strong>{stats.pendingGames}</strong> 个游戏等待审核
            </p>
            <Link href="/admin/review?status=pending">
              <Button variant="default">
                立即审核
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
