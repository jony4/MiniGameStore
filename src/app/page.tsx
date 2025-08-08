import Link from 'next/link';
import { GameList } from '@/components/GameList';
import { Button } from '@/components/ui/button';

export default function HomePage() {
  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight">
          欢迎来到HTML小游戏平台
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          发现和分享有趣的HTML小游戏
        </p>
        <div className="mt-6 space-x-4">
          <Button asChild>
            <Link href="/submit">提交游戏</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/admin">管理后台</Link>
          </Button>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold">最新游戏</h2>
          <Button asChild variant="outline">
            <Link href="/games">查看全部</Link>
          </Button>
        </div>
        <GameList 
          showStatusFilter={false}
          defaultStatus="approved"
        />
      </div>
    </div>
  );
}
