import { GameList } from '@/components/GameList';

export default function GamesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">游戏列表</h1>
        <p className="mt-2 text-muted-foreground">
          浏览所有已发布的HTML小游戏
        </p>
      </div>

      <GameList 
        showStatusFilter={true}
        defaultStatus="approved"
      />
    </div>
  );
}